'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Calendar, MessageSquare, Users, TrendingUp, Clock, Globe, Activity, DollarSign } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalMessages: number
    totalConversations: number
    activeUsers: number
    avgResponseTime: number
    totalRevenue: number
    conversionRate: number
  }
  messagesByDay: Array<{ date: string; count: number }>
  topBots: Array<{ name: string; messages: number; conversations: number }>
  userEngagement: Array<{ hour: number; messages: number }>
  deviceTypes: Array<{ type: string; count: number; percentage: number }>
  geographicData: Array<{ country: string; users: number }>
  conversionFunnel: Array<{ stage: string; users: number; percentage: number }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedBot, setSelectedBot] = useState('all')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, selectedBot])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // In production, this would fetch from your API
      // For now, using mock data
      const mockData: AnalyticsData = {
        overview: {
          totalMessages: 12543,
          totalConversations: 3421,
          activeUsers: 892,
          avgResponseTime: 1.8,
          totalRevenue: 4523.50,
          conversionRate: 3.2
        },
        messagesByDay: [
          { date: 'Mon', count: 1200 },
          { date: 'Tue', count: 1400 },
          { date: 'Wed', count: 1100 },
          { date: 'Thu', count: 1600 },
          { date: 'Fri', count: 2100 },
          { date: 'Sat', count: 1800 },
          { date: 'Sun', count: 1343 }
        ],
        topBots: [
          { name: 'Support Bot', messages: 4523, conversations: 1234 },
          { name: 'Sales Assistant', messages: 3421, conversations: 892 },
          { name: 'FAQ Bot', messages: 2890, conversations: 743 },
          { name: 'Product Guide', messages: 1709, conversations: 552 }
        ],
        userEngagement: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          messages: Math.floor(Math.random() * 500) + 100
        })),
        deviceTypes: [
          { type: 'Desktop', count: 5234, percentage: 58 },
          { type: 'Mobile', count: 2891, percentage: 32 },
          { type: 'Tablet', count: 901, percentage: 10 }
        ],
        geographicData: [
          { country: 'United States', users: 3421 },
          { country: 'United Kingdom', users: 1234 },
          { country: 'Canada', users: 892 },
          { country: 'Australia', users: 743 },
          { country: 'Germany', users: 612 }
        ],
        conversionFunnel: [
          { stage: 'Visited Site', users: 10000, percentage: 100 },
          { stage: 'Opened Chat', users: 3500, percentage: 35 },
          { stage: 'Sent Message', users: 2100, percentage: 21 },
          { stage: 'Completed Goal', users: 320, percentage: 3.2 }
        ]
      }

      setData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your chatbot performance and user engagement</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select bot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bots</SelectItem>
              <SelectItem value="support">Support Bot</SelectItem>
              <SelectItem value="sales">Sales Assistant</SelectItem>
              <SelectItem value="faq">FAQ Bot</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8.2% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">-0.3s from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages Over Time</CardTitle>
                <CardDescription>Daily message volume for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.messagesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Engagement</CardTitle>
                <CardDescription>Message distribution by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.userEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Bots</CardTitle>
              <CardDescription>Bot performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topBots}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="messages" fill="#8884d8" />
                  <Bar dataKey="conversations" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>User device distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.deviceTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.type}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users by country</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.geographicData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" />
                    <Tooltip />
                    <Bar dataKey="users" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey through conversion stages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.conversionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8884d8">
                    {data.conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.conversionFunnel.map((stage, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-medium">{stage.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}