import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, StepForward, RotateCcw, ChevronLeft } from 'lucide-react';
import { createDemoState, advanceDemoStep, resetDemoState, getDemoStep } from '@nnviz/nn-math';
import type { DemoState, DemoStep, DemoStepType } from '@nnviz/shared';
import { MathBlock } from './MathBlock';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEP_STYLES: Record<DemoStepType, { border: string; badge: string }> = {
  forward: { border: 'border-l-primary', badge: 'bg-primary/10 text-primary' },
  loss: { border: 'border-l-warning', badge: 'bg-warning/10 text-warning' },
  backward: { border: 'border-l-destructive', badge: 'bg-destructive/10 text-destructive' },
  update: { border: 'border-l-success', badge: 'bg-success/10 text-success' },
  complete: { border: 'border-l-primary', badge: 'bg-primary/10 text-primary' },
};

export function TrainingDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [useApi, setUseApi] = useState(true);

  const initDemo = useCallback(async () => {
    try {
      if (useApi) {
        const remote = await api.demoInit(0.5);
        setState(remote);
      } else {
        setState(createDemoState(0.5));
      }
    } catch {
      setUseApi(false);
      setState(createDemoState(0.5));
    }
  }, [useApi]);

  useEffect(() => {
    initDemo();
  }, [initDemo]);

  const currentStep: DemoStep | null = state ? getDemoStep(state, state.currentStep) : null;

  const stepAction = async (action: 'next' | 'prev' | 'reset') => {
    if (!state) return;

    if (useApi) {
      try {
        const { state: newState } = await api.demoStep(state, action);
        setState(newState);
        return;
      } catch {
        setUseApi(false);
      }
    }

    if (action === 'reset') setState(resetDemoState(state));
    else if (action === 'next') setState(advanceDemoStep(state));
    else if (action === 'prev') setState({ ...state, currentStep: Math.max(0, state.currentStep - 1) });
  };

  useEffect(() => {
    if (!playing || !state) return;
    if (state.currentStep >= state.totalSteps - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => stepAction('next'), 1500);
    return () => clearTimeout(timer);
  }, [playing, state]);

  if (!state || !currentStep) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading demo...
      </div>
    );
  }

  const stepStyle = STEP_STYLES[currentStep.type];

  return (
    <div className="flex flex-col py-8 sm:py-10">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-primary">Educational walkthrough</p>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Training Demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Step through forward pass, loss, backprop, and weight update on XOR data.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button onClick={() => setPlaying(!playing)}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button variant="secondary" onClick={() => stepAction('next')}>
          <StepForward size={16} />
          Step
        </Button>
        <Button variant="secondary" onClick={() => stepAction('prev')} disabled={state.currentStep === 0}>
          <ChevronLeft size={16} />
          Prev
        </Button>
        <Button
          variant="outline"
          onClick={() => { stepAction('reset'); setPlaying(false); }}
        >
          <RotateCcw size={16} />
          Reset
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          Step {state.currentStep + 1} / {state.totalSteps}
        </span>
      </div>

      <div className="mb-6 flex gap-2">
        {state.steps.map((s, i) => (
          <div
            key={s.index}
            className={cn('h-1 flex-1 rounded-full transition-colors', i <= state.currentStep ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn('rounded-xl border border-border border-l-4 bg-card p-6 shadow-sm', stepStyle.border)}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium uppercase', stepStyle.badge)}>
              {currentStep.type}
            </span>
            <h2 className="text-lg font-semibold">{currentStep.title}</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{currentStep.description}</p>

          {currentStep.formula && <MathBlock formula={currentStep.formula} />}

          {currentStep.loss !== undefined && (
            <div className="mt-4 font-mono text-2xl text-warning">
              L = {currentStep.loss.toFixed(6)}
            </div>
          )}

          {currentStep.activations && (
            <motion.div className="mt-4 grid grid-cols-3 gap-3" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              {Object.entries(currentStep.activations).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-border bg-background p-3 text-center">
                  <div className="text-xs text-muted-foreground">{key}</div>
                  <div className="font-mono text-lg text-primary">{val.toFixed(4)}</div>
                </div>
              ))}
            </motion.div>
          )}

          {currentStep.gradients && (
            <motion.div className="mt-4 space-y-2">
              {Object.entries(currentStep.gradients).map(([key, val]) => (
                <motion.div
                  key={key}
                  className="flex justify-between rounded-lg bg-destructive/10 px-3 py-2 font-mono text-sm"
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <span className="text-muted-foreground">∂L/∂{key}</span>
                  <span className="text-destructive">{val.toFixed(4)}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {currentStep.weights && (
            <div className="mt-4 space-y-2">
              {Object.entries(currentStep.weights).map(([key, val]) => (
                <div key={key} className="flex justify-between rounded-lg bg-success/10 px-3 py-2 font-mono text-sm">
                  <span>{key}</span>
                  <span className="text-success">{typeof val === 'number' ? val.toFixed(4) : String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium">Network topology</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {state.network.layers.map((l, i) => (
            <div key={l.id} className="flex items-center gap-4">
              <motion.div
                className="rounded-lg border border-border bg-background px-4 py-3 text-center"
                animate={currentStep.type === 'forward' ? { scale: [1, 1.03, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="text-xs text-muted-foreground">{l.id}</div>
                <div className="font-medium">{l.units} units</div>
                <div className="text-xs text-primary">{l.activation}</div>
              </motion.div>
              {i < state.network.layers.length - 1 && (
                <div className="text-muted-foreground">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
