"use client";

import React, { useState } from "react";

interface WorkshopTask {
  id: string;
  title: string;
  category: "Parts" | "Follow-up" | "Diagnostics" | "Bay";
  assignedTo: string;
  completed: boolean;
  dueTime: string;
}

const INITIAL_TASKS: WorkshopTask[] = [
  {
    id: "t1",
    title:
      "Call Midas supplier for VW Polo LuK clutch kit delivery status (RO-1047)",
    category: "Parts",
    assignedTo: "Brenda Dube",
    completed: false,
    dueTime: "11:30 AM",
  },
  {
    id: "t2",
    title:
      "Perform post-repair 15km test drive on BMW 320i water pump replacement (RO-1045)",
    category: "Diagnostics",
    assignedTo: "Alex Ndlovu",
    completed: true,
    dueTime: "09:00 AM",
  },
  {
    id: "t3",
    title:
      "Send WhatsApp pickup alert to John Smith for Toyota Corolla (RO-1048)",
    category: "Follow-up",
    assignedTo: "Brenda Dube",
    completed: false,
    dueTime: "14:00 PM",
  },
  {
    id: "t4",
    title: "Bay 2 4-post lift hydraulic fluid top-up & monthly inspection",
    category: "Bay",
    assignedTo: "Sipho Khumalo",
    completed: false,
    dueTime: "16:30 PM",
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<WorkshopTask[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: WorkshopTask = {
      id: `t-${Date.now()}`,
      title: newTaskTitle,
      category: "Parts",
      assignedTo: "Alex Ndlovu",
      completed: false,
      dueTime: "Today",
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="border-b border-[#212121] pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Technician Task List
        </h1>
        <p className="text-xs sm:text-sm text-[#7a7a7a] mt-0.5">
          Daily shop errands, supplier parts deliveries, and customer handover
          checklists.
        </p>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="+ Add workshop errand, supplier order, or customer call..."
          className="flex-1 rounded-xl bg-[#141414] border border-[#262626] px-4 py-2.5 text-xs text-white placeholder-[#666] focus:border-[#22c55e] focus:outline-none min-h-[44px]"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#22c55e] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#16a34a] select-none"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="rounded-3xl bg-[#141414] border border-[#242424] p-5 space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#181818] border border-[#262626] hover:border-[#383838] transition-all cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => {}}
              className="mt-1 h-4 w-4 rounded accent-[#22c55e] cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-semibold leading-relaxed ${
                  task.completed ? "line-through text-[#666]" : "text-white"
                }`}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#737373] mt-1">
                <span className="font-mono text-neutral-400">
                  {task.dueTime}
                </span>
                <span>&bull;</span>
                <span>{task.assignedTo}</span>
                <span>&bull;</span>
                <span className="bg-[#242424] text-neutral-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  {task.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
