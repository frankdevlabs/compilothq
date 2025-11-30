import { router } from '../trpc'
import { controlRouter } from './control'
import { dataCategoryRouter } from './dataCategory'
import { dataProcessingActivityRouter } from './dataProcessingActivity'
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
})

export type AppRouter = typeof appRouter
