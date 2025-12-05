import { router } from '../trpc'
import { activityAssetJunctionRouter } from './activityAssetJunctionRouter'
import { assetProcessingLocationRouter } from './assetProcessingLocationRouter'
import { controlRouter } from './control'
import { dataCategoryRouter } from './dataCategory'
import { dataProcessingActivityRouter } from './dataProcessingActivity'
import { digitalAssetRouter } from './digitalAssetRouter'
import { invitationRouter } from './invitation'
import { organizationRouter } from './organization'
import { processorRouter } from './processor'
import { riskRouter } from './risk'
import { userRouter } from './user'

export const appRouter = router({
  dataProcessingActivity: dataProcessingActivityRouter,
  control: controlRouter,
  dataCategory: dataCategoryRouter,
  invitation: invitationRouter,
  organization: organizationRouter,
  processor: processorRouter,
  risk: riskRouter,
  user: userRouter,
  digitalAsset: digitalAssetRouter,
  assetProcessingLocation: assetProcessingLocationRouter,
  activityAssetJunction: activityAssetJunctionRouter,
})

export type AppRouter = typeof appRouter
