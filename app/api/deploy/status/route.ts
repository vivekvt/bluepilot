import { vercelApiClient } from '@/lib/utils/vercelApiClient';
import { withAuth } from '@/lib/with-auth';

export const POST = withAuth(async (request: Request) => {
  const body = await request.json();

  const { deploymentId } = body;

  if (!deploymentId) {
    throw new Error('Deployment ID is required');
  }

  const apiResponse = await vercelApiClient.get(
    `/v13/deployments/${deploymentId}`
  );

  const deploymentStatus = apiResponse.data?.status;
  const deploymentUrl = apiResponse.data?.alias?.[0];

  return new Response(
    JSON.stringify({
      success: true,
      deploymentStatus,
      deploymentUrl,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
