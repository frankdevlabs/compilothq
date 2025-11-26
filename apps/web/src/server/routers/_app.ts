import { router } from '../trpc'
import { activityRouter } from './activity'
import { controlRouter } from './control'
import { dataCategoryRouter } from './dataCategory'
import { invitationRouter } from './invitation'
import { organizationRouter } from './organization'
import { processorRouter } from './processor'
import { riskRouter } from './risk'
import { userRouter } from './user'

export const appRouter = router({
  activity: activityRouter,
  control: controlRouter,
  dataCategory: dataCategoryRouter,
  invitation: invitationRouter,
  organization: organizationRouter,
  processor: processorRouter,
  risk: riskRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
