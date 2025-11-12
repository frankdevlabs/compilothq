import { router } from '../trpc'
import { activityRouter } from './activity'
import { controlRouter } from './control'
import { dataCategoryRouter } from './dataCategory'
import { processorRouter } from './processor'
import { riskRouter } from './risk'

export const appRouter = router({
  activity: activityRouter,
  processor: processorRouter,
  dataCategory: dataCategoryRouter,
  risk: riskRouter,
  control: controlRouter,
})

export type AppRouter = typeof appRouter
