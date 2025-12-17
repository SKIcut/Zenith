import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-xl font-bold">Analytics</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analytics Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            Track your progress, habits, and mentoring sessions. This feature is under development.
          </p>
        </div>
      </div>
    </div>
  );
}