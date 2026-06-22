import ProductionOrder from "../models/ProductionOrder.js";
import ProductionDesign from "../models/ProductionDesign.js";
import Machine from "../models/Machine.js";
import MachineHistory from "../models/MachineHistory.js";
import { createAlert } from "./alertController.js";

export const getDashboardData = async (req, res) => {
  try {
    const [orders, designs, machines] = await Promise.all([
      ProductionOrder.find().lean(),
      ProductionDesign.find().populate("order machine").lean(),
      Machine.find()
        .populate({
          path: "currentJob",
          populate: { path: "order" },
        })
        .lean(),
    ]);

    // Auto-heal order statuses (fixes older data that went out of sync)
    let needsRefetch = false;
    for (const order of orders) {
      const orderDesigns = designs.filter(
        (d) => d.order && d.order._id.toString() === order._id.toString(),
      );
      let expectedStatus = "Pending";

      if (orderDesigns.length > 0) {
        const isAllFinished = orderDesigns.every(
          (d) => d.processStatus === "Finished",
        );
        if (isAllFinished) {
          expectedStatus = "Finished";
        } else {
          const activeDesign = orderDesigns.find(
            (d) => !["Pending", "Finished"].includes(d.processStatus),
          );
          if (activeDesign) {
            expectedStatus = activeDesign.processStatus;
          } else if (orderDesigns.some((d) => d.processStatus === "Finished")) {
            expectedStatus = "Machine Allocated";
          }
        }
      }

      if (order.status !== expectedStatus) {
        await ProductionOrder.findByIdAndUpdate(order._id, {
          status: expectedStatus,
        });
        order.status = expectedStatus;
      }
    }

    res.json({ orders, designs, machines });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { orderNo, partyName, selvedge, targetDeliveryDate } = req.body;
    const order = await ProductionOrder.create({
      orderNo,
      partyName,
      selvedge,
      targetDeliveryDate,
    });
    await createAlert('Order Created', `Production Order ${orderNo} has been created.`, 'Process', 'info', req.user ? req.user._id : null);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const designs = await ProductionDesign.find({ order: id });
    for (const d of designs) {
      if (d.machine) {
        await Machine.findByIdAndUpdate(d.machine, {
          status: "Available",
          currentJob: null,
        });
      }
    }
    await ProductionDesign.deleteMany({ order: id });
    await ProductionOrder.findByIdAndDelete(id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await ProductionOrder.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createDesign = async (req, res) => {
  try {
    const design = await ProductionDesign.create(req.body);

    if (design.machine) {
      await Machine.findByIdAndUpdate(design.machine, {
        status: "Occupied",
        currentJob: design._id,
      });
    }

    if (design.processStatus) {
      const allDesigns = await ProductionDesign.find({ order: design.order });
      let expectedStatus = "Pending";

      if (allDesigns.length > 0) {
        const activeDesigns = allDesigns.filter(
          (d) => !["Finished", "Cancelled"].includes(d.processStatus),
        );
        if (activeDesigns.length === 0) {
          const allCancelled = allDesigns.every(
            (d) => d.processStatus === "Cancelled",
          );
          expectedStatus = allCancelled ? "Cancelled" : "Finished";
        } else {
          const holdDesign = activeDesigns.find(
            (d) => d.processStatus === "Hold",
          );
          const runningDesign = activeDesigns.find(
            (d) => !["Hold", "Pending"].includes(d.processStatus),
          );

          if (runningDesign) {
            expectedStatus = runningDesign.processStatus;
          } else if (holdDesign) {
            expectedStatus = "Hold";
          } else {
            expectedStatus = "Pending";
          }
        }
      }

      await ProductionOrder.findByIdAndUpdate(design.order, {
        status: expectedStatus,
      });
    }

    res.status(201).json(design);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const oldDesign = await ProductionDesign.findById(id);

    let updateData = { ...req.body };
    if (updateData.meterEntries && Array.isArray(updateData.meterEntries)) {
      updateData.totalMeter = updateData.meterEntries.reduce(
        (sum, val) => sum + val,
        0,
      );
    }

    const updatedDesign = await ProductionDesign.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    // Machine allocation validation & logic
    if (
      req.body.machine &&
      (!oldDesign.machine || oldDesign.machine.toString() !== req.body.machine)
    ) {
      const machine = await Machine.findById(req.body.machine);
      if (machine.status === "Occupied" || machine.status === "Running") {
        return res
          .status(400)
          .json({
            message: `Machine ${machine.name || machine.machineId} already occupied.`,
          });
      }

      // Free old machine if any
      if (oldDesign.machine) {
        await Machine.findByIdAndUpdate(oldDesign.machine, {
          status: "Available",
          currentJob: null,
        });
        const order = await ProductionOrder.findById(oldDesign.order);
        await MachineHistory.create({
          machine: oldDesign.machine,
          design: oldDesign._id,
          partyName: order ? order.partyName : "",
          meter: oldDesign.totalMeter,
          startDate: oldDesign.silicateStartDate,
          endDate: new Date(),
        });
      }

      // Occupy new machine
      await Machine.findByIdAndUpdate(req.body.machine, {
        status: "Occupied",
        currentJob: updatedDesign._id,
      });
    } else if (req.body.machine === null && oldDesign.machine) {
      // Free machine
      await Machine.findByIdAndUpdate(oldDesign.machine, {
        status: "Available",
        currentJob: null,
      });
      const order = await ProductionOrder.findById(oldDesign.order);
      await MachineHistory.create({
        machine: oldDesign.machine,
        design: oldDesign._id,
        partyName: order ? order.partyName : "",
        meter: oldDesign.totalMeter,
        startDate: oldDesign.silicateStartDate,
        endDate: new Date(),
      });
    }

    // Also log history if processStatus goes to Finished or Cancelled
    if (
      ["Finished", "Cancelled"].includes(req.body.processStatus) &&
      oldDesign.processStatus !== req.body.processStatus &&
      updatedDesign.machine
    ) {
      await Machine.findByIdAndUpdate(updatedDesign.machine, {
        status: "Available",
        currentJob: null,
      });
      const order = await ProductionOrder.findById(updatedDesign.order);
      await MachineHistory.create({
        machine: updatedDesign.machine,
        design: updatedDesign._id,
        partyName: order ? order.partyName : "",
        meter: updatedDesign.totalMeter,
        startDate: updatedDesign.silicateStartDate,
        endDate: new Date(),
      });
      // also remove machine from design so it doesn't show as occupied
      await ProductionDesign.findByIdAndUpdate(id, { machine: null });
      updatedDesign.machine = null; // Update local object so response accurately reflects freed machine
    }

    // Auto-update overall Order Status based on all its designs
    if (req.body.processStatus && oldDesign.processStatus !== req.body.processStatus) {
      await createAlert('Process Status Updated', `Design process status changed to ${req.body.processStatus}.`, 'Process', 'info', req.user ? req.user._id : null);
      const allDesigns = await ProductionDesign.find({
        order: updatedDesign.order,
      });
      let expectedStatus = "Pending";

      if (allDesigns.length > 0) {
        const activeDesigns = allDesigns.filter(
          (d) => !["Finished", "Cancelled"].includes(d.processStatus),
        );
        if (activeDesigns.length === 0) {
          const allCancelled = allDesigns.every(
            (d) => d.processStatus === "Cancelled",
          );
          expectedStatus = allCancelled ? "Cancelled" : "Finished";
        } else {
          const holdDesign = activeDesigns.find(
            (d) => d.processStatus === "Hold",
          );
          const runningDesign = activeDesigns.find(
            (d) => !["Hold", "Pending"].includes(d.processStatus),
          );

          if (runningDesign) {
            expectedStatus = runningDesign.processStatus;
          } else if (holdDesign) {
            expectedStatus = "Hold";
          } else {
            expectedStatus = "Pending";
          }
        }
      }

      await ProductionOrder.findByIdAndUpdate(updatedDesign.order, {
        status: expectedStatus,
      });
    }

    res.json(updatedDesign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const design = await ProductionDesign.findById(id);
    if (design.machine) {
      await Machine.findByIdAndUpdate(design.machine, {
        status: "Available",
        currentJob: null,
      });
      const order = await ProductionOrder.findById(design.order);
      await MachineHistory.create({
        machine: design.machine,
        design: design._id,
        partyName: order ? order.partyName : "",
        meter: design.totalMeter,
        startDate: design.silicateStartDate,
        endDate: new Date(),
      });
    }
    await ProductionDesign.findByIdAndDelete(id);

    // Auto-update overall Order Status based on remaining designs
    const allDesigns = await ProductionDesign.find({ order: design.order });
    let expectedStatus = "Pending";

    if (allDesigns.length > 0) {
      const activeDesigns = allDesigns.filter(
        (d) => !["Finished", "Cancelled"].includes(d.processStatus),
      );
      if (activeDesigns.length === 0) {
        const allCancelled = allDesigns.every(
          (d) => d.processStatus === "Cancelled",
        );
        expectedStatus = allCancelled ? "Cancelled" : "Finished";
      } else {
        const holdDesign = activeDesigns.find(
          (d) => d.processStatus === "Hold",
        );
        const runningDesign = activeDesigns.find(
          (d) => !["Hold", "Pending"].includes(d.processStatus),
        );

        if (runningDesign) {
          expectedStatus = runningDesign.processStatus;
        } else if (holdDesign) {
          expectedStatus = "Hold";
        } else {
          expectedStatus = "Pending";
        }
      }
    }

    await ProductionOrder.findByIdAndUpdate(design.order, {
      status: expectedStatus,
    });

    res.json({ message: "Design deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPartyHistory = async (req, res) => {
  try {
    const { partyName } = req.params;
    const orders = await ProductionOrder.find({ partyName }).lean();
    const orderIds = orders.map((o) => o._id);
    const designs = await ProductionDesign.find({ order: { $in: orderIds } })
      .populate("order machine")
      .lean();

    res.json({ orders, designs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMachineHistory = async (req, res) => {
  try {
    const { machineId } = req.params;
    const history = await MachineHistory.find({ machine: machineId })
      .populate("design")
      .lean();
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMachine = async (req, res) => {
  try {
    const { machineId, name } = req.body;
    let newMachineData = { name, status: "Available" };
    if (machineId) {
      newMachineData.machineId = machineId;
    } else {
      // Generate a simple unique ID if none provided since it requires uniqueness
      newMachineData.machineId = `MCH-${Date.now()}`;
    }
    const machine = await Machine.create(newMachineData);
    await createAlert('Machine Created', `Machine ${machine.name || machine.machineId} has been created.`, 'Process', 'success', req.user ? req.user._id : null);
    res.status(201).json(machine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await Machine.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(machine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await Machine.findById(id);
    if (!machine) return res.status(404).json({ message: "Machine not found" });
    if (machine.status === "Occupied" || machine.status === "Running") {
      return res
        .status(400)
        .json({ message: "Cannot delete an occupied machine." });
    }
    await Machine.findByIdAndDelete(id);
    // Remove references to this machine in ProductionDesign
    await ProductionDesign.updateMany(
      { machine: id },
      { $set: { machine: null } },
    );
    res.json({ message: "Machine deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
