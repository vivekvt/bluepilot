import { useEffect, useRef, useState } from 'react';

export function useStepsProcessor(
  steps: any,
  isLoading: boolean,
  processStep: any,
  onComplete: any
) {
  const [processingState, setProcessingState] = useState({
    processed: 0,
    total: 0,
    isProcessing: false,
    hasCompleted: false,
    errors: [],
  });

  // Store the callback in a ref to avoid dependency changes
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Process steps whenever steps array changes or loading state changes
  useEffect(() => {
    // Helper function to process steps sequentially
    const processSteps = async () => {
      // Prevent concurrent processing
      if (processingState.isProcessing) return;

      // If we've processed all available steps, nothing to do
      if (!steps || processingState.processed >= steps.length) return;

      setProcessingState((prev) => ({ ...prev, isProcessing: true }));

      try {
        // Process steps sequentially starting from the last processed step
        for (let i = processingState.processed; i < steps.length; i++) {
          try {
            await processStep(steps[i]);
            // Update processed count after each successful step
            setProcessingState((prev) => ({
              ...prev,
              processed: prev.processed + 1,
              total: steps.length,
            }));
          } catch (error) {
            // Record error but continue with next step
            console.error(`Error processing step ${i}:`, error);
            // setProcessingState((prev) => ({
            //   ...prev,
            //   errors: [...prev.errors, { step: i, error }],
            // }));
          }
        }

        // Check if we're done (not loading and all steps processed)
        const allComplete =
          !isLoading && steps && processingState.processed === steps.length;

        if (allComplete && !processingState.hasCompleted) {
          setProcessingState((prev) => ({ ...prev, hasCompleted: true }));
          // Call the onComplete callback
          onCompleteRef.current();
        }
      } finally {
        setProcessingState((prev) => ({ ...prev, isProcessing: false }));
      }
    };

    // Start processing if there are new steps to process
    if (
      steps &&
      steps.length > processingState.processed &&
      !processingState.isProcessing
    ) {
      processSteps();
    }

    // Check completion condition if loading just finished
    if (
      !isLoading &&
      steps &&
      processingState.processed === steps.length &&
      !processingState.hasCompleted
    ) {
      setProcessingState((prev) => ({ ...prev, hasCompleted: true }));
      onCompleteRef.current();
    }
  }, [steps, isLoading, processingState, processStep]);

  return processingState;
}
