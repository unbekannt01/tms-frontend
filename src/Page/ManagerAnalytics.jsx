import { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function ManagerAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("timeframe"); // 'timeframe' or 'daterange'
  const [timeframe, setTimeframe] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = "/manager/analytics?";

      if (filterMode === "daterange" && startDate && endDate) {
        url += `startDate=${startDate}&endDate=${endDate}`;
      } else {
        url += `timeframe=${timeframe}`;
      }

      const res = await API.get(url);
      setData(res.data?.data || null);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleApplyFilter = () => {
    if (filterMode === "daterange" && (!startDate || !endDate)) {
      setError("Please select both start and end dates");
      return;
    }
    fetchAnalytics();
  };

  const handleFilterModeChange = (event, newMode) => {
    if (newMode !== null) {
      setFilterMode(newMode);
      setError("");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error || "No data"}</Typography>
      </Box>
    );
  }

  const {
    overview,
    taskDistribution,
    productivityTrends,
    teamPerformance,
    priorityAnalysis,
    completionRates,
    overdueAnalysis,
    workloadBalance,
  } = data;

  const COLORS = ["#059669", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6"];

  const statusData =
    taskDistribution?.byStatus?.map((item) => ({
      name: item.status,
      value: item.count,
    })) || [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            border: "1px solid rgba(6, 95, 70, 0.1)",
          }}
        >
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
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#065f46" }}
              >
                Team Analytics Dashboard
              </Typography>
              <Chip
                label="← Back"
                onClick={() => navigate("/manager-dashboard")}
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
          {/* Overview cards */}
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#6b7280",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Total Tasks
                </Typography>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 700, color: "#065f46", mt: 1 }}
                >
                  {overview.totalTasks}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
                  All assigned tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                height: "100%",
                bgcolor: "#f0fdf4",
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#059669",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Completed
                </Typography>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 700, color: "#059669", mt: 1 }}
                >
                  {overview.completed}
                </Typography>
                <Typography variant="body2" sx={{ color: "#047857", mt: 1 }}>
                  Successfully finished
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                height: "100%",
                bgcolor: "#fef2f2",
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#dc2626",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Overdue
                </Typography>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 700, color: "#dc2626", mt: 1 }}
                >
                  {overview.overdue}
                </Typography>
                <Typography variant="body2" sx={{ color: "#b91c1c", mt: 1 }}>
                  Past deadline
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                height: "100%",
                bgcolor: "#eff6ff",
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#2563eb",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Completion Rate
                </Typography>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 700, color: "#2563eb", mt: 1 }}
                >
                  {overview.completionRate}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={overview.completionRate}
                  sx={{
                    mt: 2,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "#dbeafe",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#2563eb",
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Productivity Trends */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                height: 400,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}
              >
                Productivity Trends
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Daily task creation and completion patterns
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productivityTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="tasksCreated"
                    stroke="#059669"
                    strokeWidth={3}
                    name="Tasks Created"
                    dot={{ r: 4, fill: "#059669" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasksCompleted"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Tasks Completed"
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                height: 400,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}
              >
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Team Performance */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}
              >
                Team Performance Overview
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
                Individual member statistics and completion rates
              </Typography>
              <Grid container spacing={3}>
                {teamPerformance.map((member, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={idx}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 2, height: "100%" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: "#065f46" }}
                          >
                            {member.name}
                          </Typography>
                          <Chip
                            label={`${member.onTimeRate || 0}% On-Time`}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor:
                                member.onTimeRate >= 80
                                  ? "#d1fae5"
                                  : member.onTimeRate >= 60
                                  ? "#fef3c7"
                                  : "#fee2e2",
                              color:
                                member.onTimeRate >= 80
                                  ? "#047857"
                                  : member.onTimeRate >= 60
                                  ? "#b45309"
                                  : "#b91c1c",
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            Total Tasks
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {member.totalTasks}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            Completed
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "#059669" }}
                          >
                            {member.completed}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280", mb: 0.5, display: "block" }}
                          >
                            Progress
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(member.completed / member.totalTasks) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: "#059669",
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
                {teamPerformance.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography color="text.secondary">
                        No team performance data available for this timeframe.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
