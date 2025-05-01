import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to process streaming steps and run a callback when complete
 * @param {Array} steps - Array of steps that might be streaming in
 * @param {boolean} isLoading - Loading state from the API
 * @param {Function} processStep - Function to process a single step
 * @param {Function} onComplete - Callback to run when all steps complete
 */

export function useStepsProcessor(
  steps: any,
  isLoading: any,
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

// In your main component
// function YourComponent() {
//   const webContainerRef = useRef(null);

//   // Your existing useObject hook
//   const {
//     object: stepsArray,
//     submit,
//     isLoading,
//     stop,
//     error: apiError,
//   } = useObject({
//     api: '/api/chat',
//     schema: z.array(stepsSchema),
//   });

//   // Function to process a single step
//   const processStep = async (step) => {
//     if (!webContainerRef.current) return;

//     console.log(`Processing step: ${step.action} ${step.path}`);

//     switch (step.action) {
//       case 'create': {
//         setSelectedFile({ content: step.content || '', path: step.path });
//         const pathParts = step.path.split('/').filter(Boolean);
//         const dirPath =
//           pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/';

//         if (dirPath !== '/') {
//           await webContainerRef.current.fs.mkdir(dirPath, { recursive: true });
//         }

//         if (!step.content) {
//           throw new Error(
//             `Content is required for creating file at ${step.path}`
//           );
//         }

//         await webContainerRef.current.fs.writeFile(
//           step.path,
//           step.content,
//           'utf8'
//         );
//         setFiles((prev) =>
//           updateFileTree(prev, step.path, 'create', step.content)
//         );
//         break;
//       }
//       case 'update': {
//         if (!step.content) {
//           throw new Error(
//             `Content is required for updating file at ${step.path}`
//           );
//         }

//         setSelectedFile({ content: step.content, path: step.path });
//         await webContainerRef.current.fs.writeFile(
//           step.path,
//           step.content,
//           'utf8'
//         );
//         setFiles((prev) =>
//           updateFileTree(prev, step.path, 'update', step.content)
//         );
//         break;
//       }
//       case 'delete': {
//         await webContainerRef.current.fs.rm(step.path, {
//           recursive: true,
//           force: true,
//         });
//         setFiles((prev) => updateFileTree(prev, step.path, 'delete'));
//         break;
//       }
//       case 'run': {
//         const [command, ...args] = step.path.split(' ');
//         await runCommand(command, args);
//         break;
//       }
//       default:
//         throw new Error(`Unknown action: ${step.action}`);
//     }

//     console.log(`Completed step: ${step.action} ${step.path}`);
//   };

//   // Function to run when all steps are complete
//   const handleAllStepsComplete = () => {
//     console.log('All steps completed successfully, starting dev server');
//     startDevServer();
//   };

//   // Use our custom hook to process steps
//   const processingStatus = useStepsProcessor(
//     stepsArray,
//     isLoading,
//     processStep,
//     handleAllStepsComplete
//   );

//   // Store webContainer reference when it's created
//   useEffect(() => {
//     if (webContainer) {
//       webContainerRef.current = webContainer;
//     }
//   }, [webContainer]);

//   // You can use processingStatus to show progress in the UI
//   useEffect(() => {
//     if (processingStatus.processed > 0) {
//       console.log(
//         `Progress: ${processingStatus.processed}/${processingStatus.total} steps processed`
//       );
//     }
//   }, [processingStatus.processed, processingStatus.total]);

//   // Rest of your component code...
//   return (
//     <div>
//       {/* Your UI components */}

//       {/* Optional progress display */}
//       {stepsArray && stepsArray.length > 0 && (
//         <div className="progress">
//           Processing steps: {processingStatus.processed}/
//           {processingStatus.total}
//           {processingStatus.isProcessing && <span> (processing...)</span>}
//           {processingStatus.hasCompleted && <span> (complete)</span>}
//         </div>
//       )}
//     </div>
//   );
// }
