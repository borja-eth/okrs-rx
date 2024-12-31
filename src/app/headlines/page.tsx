"use client";

import { useState } from "react";
import { HeadlineForm } from "@/components/headlines/HeadlineForm";
import { HeadlinesList } from "@/components/headlines/HeadlinesList";

export default function HeadlinesPage() {
  const [key, setKey] = useState(0); // Used to force refresh the list

  const handleHeadlineCreated = () => {
    setKey(prev => prev + 1); // Force refresh the list
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Headlines</h1>
        <HeadlineForm onHeadlineCreated={handleHeadlineCreated} />
      </div>
      
      <HeadlinesList key={key} />
    </div>
  );
} 