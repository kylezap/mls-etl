import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import {
  ArrowPathIcon,
  Bars3Icon,
  EllipsisHorizontalIcon,
  PlusSmallIcon,
  ChartBarIcon,
  HomeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/20/solid'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import Logo from './components/Logo'

interface ETLStatus {
  status: string;
  totalProperties: number;
  lastUpdated: string | null;
  lastRun: string | null;
  nextScheduledRun: string | null;
}

interface Property {
  id: string;
  mlsNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  listPrice: number;
  status: string;
  lastUpdated: string;
}

interface UpdateResponse {
  timestamp: number;
  data: {
    status: string;
    totalProperties: number;
    lastUpdated: string | null;
    properties: Property[];
  } | null;
}

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon },
  { name: 'Properties', href: '#', icon: ChartBarIcon },
  { name: 'Settings', href: '#', icon: Cog6ToothIcon },
]

const timeRanges = [
  { name: 'Last 24 hours', href: '#', current: true },
  { name: 'Last 7 days', href: '#', current: false },
  { name: 'Last 30 days', href: '#', current: false },
]

const statuses = {
  Active: 'text-green-700 bg-green-50 ring-green-600/20 hover:bg-green-100 transition-colors duration-200',
  Pending: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20 hover:bg-yellow-100 transition-colors duration-200',
  Sold: 'text-gray-600 bg-gray-50 ring-gray-500/10 hover:bg-gray-100 transition-colors duration-200',
  Expired: 'text-red-700 bg-red-50 ring-red-600/10 hover:bg-red-100 transition-colors duration-200',
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [status, setStatus] = useState<ETLStatus | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0)

  const checkBackendHealth = async () => {
    try {
      await axios.get('/api/health')
      setBackendStatus('connected')
      setError(null)
    } catch (err) {
      setBackendStatus('disconnected')
      setError('Cannot connect to backend server. Please make sure it is running.')
    }
  }

  const pollForUpdates = useCallback(async () => {
    if (backendStatus !== 'connected') return

    try {
      const response = await axios.get<UpdateResponse>(`/api/admin/updates?since=${lastUpdateTimestamp}`)
      const { timestamp, data } = response.data

      if (data) {
        setStatus({
          status: data.status,
          totalProperties: data.totalProperties,
          lastUpdated: data.lastUpdated,
          lastRun: null,
          nextScheduledRun: null
        })
        setProperties(data.properties)
        setLastUpdateTimestamp(timestamp)
      }
    } catch (err) {
      console.error('Error polling for updates:', err)
      setBackendStatus('disconnected')
    }
  }, [backendStatus, lastUpdateTimestamp])

  const runETL = async () => {
    try {
      setLoading(true)
      setError(null)
      await axios.post('/api/admin/etl/run')
    } catch (err) {
      setError('Failed to run ETL process')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackendHealth()
    const healthCheckInterval = setInterval(checkBackendHealth, 5000)
    return () => clearInterval(healthCheckInterval)
  }, [])

  useEffect(() => {
    if (backendStatus === 'connected') {
      pollForUpdates()
      const pollInterval = setInterval(pollForUpdates, 1000)
      return () => clearInterval(pollInterval)
    }
  }, [backendStatus, pollForUpdates])

  const stats = [
    { name: 'Total Properties', value: status?.totalProperties.toLocaleString() || '0', change: '+4.75%', changeType: 'positive' },
    { name: 'Active Listings', value: properties.filter(p => p.status === 'Active').length.toString(), change: '+2.02%', changeType: 'positive' },
    { name: 'Pending Sales', value: properties.filter(p => p.status === 'Pending').length.toString(), change: '-1.39%', changeType: 'negative' },
    { name: 'Sold Properties', value: properties.filter(p => p.status === 'Sold').length.toString(), change: '+10.18%', changeType: 'positive' },
  ]

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-50 flex h-16 border-b border-gray-900/10 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-x-6">
            <button 
              type="button" 
              onClick={() => setMobileMenuOpen(true)} 
              className="-m-3 p-3 md:hidden hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-5 w-5 text-gray-900" aria-hidden="true" />
            </button>
            <Logo />
          </div>
          <nav className="hidden md:flex md:gap-x-11 md:text-sm/6 md:font-semibold md:text-gray-700">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 hover:text-indigo-600 transition-colors duration-200"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-x-8">
            <button 
              type="button" 
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
        <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-4 pb-6 sm:max-w-sm sm:px-6 sm:ring-1 sm:ring-gray-900/10">
            <div className="-ml-0.5 flex h-16 items-center gap-x-6">
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)} 
                className="-m-2.5 p-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="-ml-0.5">
                <a href="#" className="-m-1.5 block p-1.5">
                  <span className="sr-only">ETL Dashboard</span>
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindcss.com/img/logos/mark.svg?color=indigo&shade=600"
                    alt=""
                  />
                </a>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 -mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      <main>
        <div className="relative isolate overflow-hidden pt-16">
          {/* Background gradient */}
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          {/* Secondary navigation */}
          <header className="pb-4 pt-6 sm:pb-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 sm:flex-nowrap sm:px-6 lg:px-8">
              <h1 className="text-base font-semibold leading-7 text-gray-900">ETL Dashboard</h1>
              <div className="order-last flex w-full gap-x-8 text-sm font-semibold leading-6 sm:order-none sm:w-auto sm:border-l sm:border-gray-200 sm:pl-6 sm:leading-7">
                {timeRanges.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current ? 'text-indigo-600' : 'text-gray-700'
                    } hover:text-indigo-500 transition-colors duration-200`}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <button
                onClick={runETL}
                disabled={loading || backendStatus === 'disconnected'}
                className="ml-auto flex items-center gap-x-1 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusSmallIcon className="-ml-1.5 h-5 w-5" aria-hidden="true" />
                Run ETL
              </button>
            </div>
          </header>

          {/* Stats */}
          <div className="border-b border-b-gray-900/10 lg:border-t lg:border-t-gray-900/5">
            <dl className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:px-2 xl:px-0">
              {stats.map((stat, statIdx) => (
                <div
                  key={stat.name}
                  className={classNames(
                    statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                    'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-gray-900/5 px-4 py-10 sm:px-6 lg:border-t-0 xl:px-8 hover:bg-gray-50 transition-colors duration-200'
                  )}
                >
                  <dt className="text-sm font-medium leading-6 text-gray-500">{stat.name}</dt>
                  <dd
                    className={classNames(
                      stat.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700',
                      'text-xs font-medium'
                    )}
                  >
                    {stat.change}
                  </dd>
                  <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Recent activity */}
          <div className="space-y-16 py-16 xl:space-y-20">
            <div>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="mx-auto max-w-2xl text-base font-semibold text-gray-900 lg:mx-0 lg:max-w-none">
                  Recent Properties
                </h2>
              </div>
              <div className="mt-6 overflow-hidden border-t border-gray-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                    <table className="w-full text-left">
                      <thead className="sr-only">
                        <tr>
                          <th>Amount</th>
                          <th className="hidden sm:table-cell">Client</th>
                          <th>More details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="relative py-5 pr-6">
                              <div className="flex gap-x-6">
                                <div className="flex-auto">
                                  <div className="flex items-start gap-x-3">
                                    <div className="text-sm font-medium leading-6 text-gray-900">
                                      {property.streetAddress}
                                    </div>
                                    <div
                                      className={classNames(
                                        statuses[property.status as keyof typeof statuses],
                                        'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                                      )}
                                    >
                                      {property.status}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs leading-5 text-gray-500">
                                    {property.city}, {property.state}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden py-5 pr-6 sm:table-cell">
                              <div className="text-sm leading-6 text-gray-900">${property.listPrice.toLocaleString()}</div>
                              <div className="mt-1 text-xs leading-5 text-gray-500">MLS #{property.mlsNumber}</div>
                            </td>
                            <td className="py-5 text-right">
                              <div className="flex justify-end">
                                <a
                                  href="#"
                                  className="text-sm font-medium leading-6 text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                                >
                                  View<span className="hidden sm:inline"> property</span>
                                  <span className="sr-only">, {property.streetAddress}</span>
                                </a>
                              </div>
                              <div className="mt-1 text-xs leading-5 text-gray-500">
                                Updated <time dateTime={property.lastUpdated}>
                                  {new Date(property.lastUpdated).toLocaleDateString()}
                                </time>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background gradient */}
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>
      </main>
    </>
  )
} 