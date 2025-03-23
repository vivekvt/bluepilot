import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewProps {
  webContainer: WebContainer;
}

export default function Preview({ webContainer }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  const run = async () => {
    console.log('run');
    const exitCode = await installDependencies();
    if (exitCode !== 0) {
      throw new Error('Installation failed');
    }
    startDevServer();
  };

  const installDependencies = async () => {
    const installProcess = await webContainer.spawn('npm', ['install']);

    console.log('installProcess.exit', installProcess.exit);

    // installProcess.output.pipeTo(
    //   new WritableStream({
    //     write(data) {
    //       console.log(data);
    //     },
    //   })
    // );
    return installProcess.exit;
  };

  async function startDevServer() {
    // Run `npm run start` to start the Express app
    await webContainer.spawn('npm', ['run', 'dev']);

    // Wait for `server-ready` event
    webContainer.on('server-ready', (port, url) => {
      console.log({ port, url });
      setUrl(url);
    });
  }

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="w-full h-full">
      {/* <iframe
        src="https://jsfiddle.net/about"
        className="h-full w-full border-none m-0 p-0"
      ></iframe> */}
      {url ? (
        <iframe
          className="h-full w-full border-none m-0 p-0"
          src={url}
          frameBorder="0"
          allowFullScreen
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
