"use client";

import { useState } from "react";
import { TodosList } from "@/components/todos/TodosList";

export default function TodosPage() {
  const [key, setKey] = useState(0); // Used to force refresh the list

  const handleTodoUpdated = () => {
    setKey(prev => prev + 1); // Force refresh the list
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">To Do's</h1>
        <p className="text-muted-foreground mt-1">
          Manage and track your deliverables
        </p>
      </div>
      
      <TodosList key={key} onUpdate={handleTodoUpdated} />
    </div>
  );
} 