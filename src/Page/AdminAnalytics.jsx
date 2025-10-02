import { useEffect, useState } from "react"
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  LinearProgress,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts"
import API from "../api"
import { useNavigate } from "react-router-dom"

export default function AdminAnalytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState("timeframe") // 'timeframe' or 'daterange'
  const [timeframe, setTimeframe] = useState("30")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      let url = "/admin/analytics?"

      if (filterMode === "daterange" && startDate && endDate) {
        url += `startDate=${startDate}&endDate=${endDate}`
      } else {
        url += `timeframe=${timeframe}`
      }

      const res = await API.get(url)
      setData(res.data?.data || null)
      setError("")
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleApplyFilter = () => {
    if (filterMode === "daterange" && (!startDate || !endDate)) {
      setError("Please select both start and end dates")
      return
    }
    fetchAnalytics()
  }

  const handleFilterModeChange = (event, newMode) => {
    if (newMode !== null) {
      setFilterMode(newMode)
      setError("")
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    )
  }

  if (!data) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error || "No data"}</Typography>
      </Box>
    )
  }

  const { overview, statusDistribution, priorityDistribution, completionRates, trends, byRole, topManagers, topUsers } =
    data

  const COLORS = ['#059669', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6']

  const statusData = statusDistribution?.map(item => ({
    name: item.status,
    value: item.count
  })) || []

  return (
    <Box
      sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)", py: 4 }}
    >
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid rgba(6, 95, 70, 0.1)" }}>
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                mb: 3,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#065f46" }}>
                Admin Analytics Dashboard
              </Typography>
              <Chip
                label="← Back"
                onClick={() => navigate("/admin-dashboard")}
                sx={{ cursor: "pointer", fontWeight: 600 }}
              />
            </Box>

            {/* Filter Controls */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <ToggleButtonGroup
                value={filterMode}
                exclusive
                onChange={handleFilterModeChange}
                size="small"
                sx={{ alignSelf: "flex-start" }}
              >
                <ToggleButton value="timeframe" sx={{ px: 3 }}>
                  Quick Timeframe
                </ToggleButton>
                <ToggleButton value="daterange" sx={{ px: 3 }}>
                  Custom Date Range
                </ToggleButton>
              </ToggleButtonGroup>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {filterMode === "timeframe" ? (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Timeframe</InputLabel>
                    <Select
                      label="Timeframe"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                    >
                      <MenuItem value="7">Last 7 Days</MenuItem>
                      <MenuItem value="14">Last 14 Days</MenuItem>
                      <MenuItem value="30">Last 30 Days</MenuItem>
                      <MenuItem value="60">Last 60 Days</MenuItem>
                      <MenuItem value="90">Last 90 Days</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 180 }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 180 }}
                    />
                  </>
                )}
                <Button
                  variant="contained"
                  onClick={handleApplyFilter}
                  sx={{
                    bgcolor: "#059669",
                    "&:hover": { bgcolor: "#047857" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  Apply Filter
                </Button>
              </Box>

              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Tasks
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#065f46", mt: 1 }}>
                  {overview.totalTasks}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
                  System-wide tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", height: '100%', bgcolor: '#f0fdf4' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Completed
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#059669", mt: 1 }}>
                  {overview.completed}
                </Typography>
                <Typography variant="body2" sx={{ color: "#047857", mt: 1 }}>
                  Successfully finished
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", height: '100%', bgcolor: '#fef2f2' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Overdue
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#dc2626", mt: 1 }}>
                  {overview.overdue}
                </Typography>
                <Typography variant="body2" sx={{ color: "#b91c1c", mt: 1 }}>
                  Past deadline
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", height: '100%', bgcolor: '#eff6ff' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Completion Rate
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#2563eb", mt: 1 }}>
                  {overview.completionRate}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={overview.completionRate} 
                  sx={{ 
                    mt: 2, 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#dbeafe',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#2563eb'
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb", height: 400 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}>
                Productivity Trends
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Daily task creation and completion patterns
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasksCreated" 
                    stroke="#059669" 
                    strokeWidth={3}
                    name="Tasks Created" 
                    dot={{ r: 4, fill: '#059669' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasksCompleted" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    name="Tasks Completed"
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb", height: 400 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}>
                Status Distribution
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Task breakdown by status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}>
                Role-Based Task Distribution
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Task assignment and creation breakdown by user roles
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#065f46" }}>
                      Tasks Assigned To
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            👤 Users
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                            {byRole.assigned.user || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(byRole.assigned.user / overview.totalTasks) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#059669' }
                          }} 
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            👔 Managers
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                            {byRole.assigned.manager || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(byRole.assigned.manager / overview.totalTasks) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' }
                          }} 
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ⚙️ Admins
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                            {byRole.assigned.admin || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(byRole.assigned.admin / overview.totalTasks) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' }
                          }} 
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#065f46" }}>
                      Tasks Created By
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            👤 Users
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                            {byRole.created.user || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(byRole.created.user / overview.totalTasks) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#059669' }
                          }} 
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            👔 Managers
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                            {byRole.created.manager || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(byRole.created.manager / overview.totalTasks) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' }
                          }} 
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ⚙️ Admins
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                            {byRole.created.admin || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(byRole.created.admin / overview.totalTasks) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' }
                          }} 
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}>
                Top Managers
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Best performing managers by task assignment
              </Typography>
              <Grid container spacing={2}>
                {topManagers.map((manager, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: idx === 0 ? '#f0fdf4' : 'transparent' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {idx === 0 && <span style={{ fontSize: '20px' }}>🏆</span>}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#065f46" }}>
                            {manager.name}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${manager.completionRate}%`} 
                          size="small" 
                          sx={{ 
                            bgcolor: manager.completionRate >= 80 ? '#d1fae5' : manager.completionRate >= 60 ? '#fef3c7' : '#fee2e2',
                            color: manager.completionRate >= 80 ? '#047857' : manager.completionRate >= 60 ? '#b45309' : '#b91c1c',
                            fontWeight: 700
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          <span style={{ fontWeight: 700, color: '#059669' }}>{manager.tasksAssigned}</span> tasks assigned
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={manager.completionRate} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: '#e5e7eb',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: manager.completionRate >= 80 ? '#059669' : manager.completionRate >= 60 ? '#f59e0b' : '#ef4444'
                          }
                        }} 
                      />
                    </Paper>
                  </Grid>
                ))}
                {topManagers.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No manager data available for this timeframe.</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}>
                Top Users
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Most productive users by completed tasks
              </Typography>
              <Grid container spacing={2}>
                {topUsers.map((user, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: idx === 0 ? '#eff6ff' : 'transparent' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {idx === 0 && <span style={{ fontSize: '20px' }}>⭐</span>}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#065f46" }}>
                            {user.name}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${user.activeTasks} active`} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#e0e7ff',
                            color: '#3730a3',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>{user.tasksCompleted}</span> completed
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(user.tasksCompleted / (user.tasksCompleted + user.activeTasks)) * 100} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: '#e5e7eb',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#2563eb'
                          }
                        }} 
                      />
                    </Paper>
                  </Grid>
                ))}
                {topUsers.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No user data available for this timeframe.</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}