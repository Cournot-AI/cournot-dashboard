"use client";

import { cn } from "@/lib/utils";
import {
  Sparkles,
  Search,
  ShieldCheck,
  Brain,
  Scale,
  Package,
  CheckCircle2,
  Loader2,
  Circle,
} from "lucide-react";

export type StepStatus = "pending" | "running" | "completed" | "error";

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  completedDescription?: string;
  status: StepStatus;
  icon: typeof Sparkles;
}

const defaultSteps: Omit<PipelineStep, "status">[] = [
  {
    id: "prompt",
    name: "Prompt",
    description: "Compiling market specification",
    icon: Sparkles,
  },
  {
    id: "collect",
    name: "Collect",
    description: "Gathering evidence from sources",
    icon: Search,
  },
  {
    id: "quality_check",
    name: "Quality Check",
    description: "Evaluating evidence quality",
    icon: ShieldCheck,
  },
  {
    id: "audit",
    name: "Audit",
    description: "Analyzing and reasoning",
    icon: Brain,
  },
  {
    id: "judge",
    name: "Judge",
    description: "Reaching verdict",
    icon: Scale,
  },
  {
    id: "bundle",
    name: "Bundle",
    description: "Creating proof bundle",
    icon: Package,
  },
];

function StepIcon({ status, Icon }: { status: StepStatus; Icon: typeof Sparkles }) {
  if (status === "completed") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  }
  if (status === "running") {
    return (
      <div className="relative">
        <Icon className="h-5 w-5 text-violet-400" />
        <div className="absolute -inset-1">
          <div className="h-7 w-7 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
        </div>
      </div>
    );
  }
  if (status === "error") {
    return <Circle className="h-5 w-5 text-red-400" />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
}

interface PipelineProgressProps {
  steps: PipelineStep[];
  currentStep?: string | null;
}

export function PipelineProgress({ steps }: PipelineProgressProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === steps.length;
  const runningStep = steps.find((s) => s.status === "running");

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold">Oracle Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone
              ? "Resolution complete"
              : runningStep
              ? `Step ${steps.indexOf(runningStep) + 1}/${steps.length}: ${runningStep.name}`
              : "Multi-step resolution in progress"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allDone ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">
                {completedCount}/{steps.length} completed
              </span>
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
              <span className="text-xs text-muted-foreground">
                {completedCount}/{steps.length} completed
              </span>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border/50" />

        {/* Completed progress line */}
        <div
          className="absolute left-[18px] top-0 w-0.5 bg-emerald-400 transition-all duration-500"
          style={{
            height: `${(steps.filter((s) => s.status === "completed").length / steps.length) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="space-y-4 relative">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg transition-all duration-300",
                step.status === "running" && "bg-violet-500/10 border border-violet-500/20",
                step.status === "completed" && "opacity-80",
                step.status === "pending" && "opacity-50"
              )}
            >
              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border">
                <StepIcon status={step.status} Icon={step.icon} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.status === "running" && "text-violet-400",
                      step.status === "completed" && "text-emerald-400",
                      step.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </p>
                  {step.status === "completed" && (
                    <span className="text-[10px] text-emerald-400 font-medium">✓</span>
                  )}
                  {step.status === "running" && (
                    <span className="text-[10px] text-violet-400 font-medium animate-pulse">
                      Working...
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    step.status === "running"
                      ? "text-violet-300/70"
                      : step.status === "completed" && step.completedDescription
                      ? "text-emerald-400/70"
                      : "text-muted-foreground"
                  )}
                >
                  {step.status === "completed" && step.completedDescription
                    ? step.completedDescription
                    : step.description}
                </p>
              </div>

              {/* Step number */}
              <div
                className={cn(
                  "text-[10px] font-mono",
                  step.status === "completed"
                    ? "text-emerald-400"
                    : step.status === "running"
                    ? "text-violet-400"
                    : "text-muted-foreground/50"
                )}
              >
                {index + 1}/{steps.length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function createInitialSteps(): PipelineStep[] {
  return defaultSteps.map((s) => ({ ...s, status: "pending" as StepStatus }));
}

export function updateStepStatus(
  steps: PipelineStep[],
  stepId: string,
  status: StepStatus,
  completedDescription?: string
): PipelineStep[] {
  return steps.map((s) =>
    s.id === stepId
      ? { ...s, status, ...(completedDescription && { completedDescription }) }
      : s
  );
}
