"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getRoles, createRole, updateRole, assignRole, getUsers } from "../services/roleService"

const RoleManagement = () => {
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([])
  const [selectedRoleName, setSelectedRoleName] = useState("")

  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    permissions: [],
  })
  const [assignData, setAssignData] = useState({
    userId: "",
    roleId: "",
  })

  // Available permissions (you can expand this list)
  const availablePermissions = [
    "role:manage",
    "role:assign",
    "user:manage",
    "user:view",
    "dashboard:view",
    "reports:view",
    "settings:manage",
  ]

  useEffect(() => {
    // Check authentication and permissions
    const userData = localStorage.getItem("user")
    if (!userData) {
      navigate("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    setCurrentUser(parsedUser)

    // Check if user has role management permissions
    const userPermissions = parsedUser.roleId?.permissions || []
    const hasRoleManagePermission = userPermissions.includes("role:manage") || parsedUser.roleId?.name === "admin"

    if (!hasRoleManagePermission) {
      setError("You don't have permission to manage roles")
      return
    }

    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesData, usersData] = await Promise.all([getRoles(), getUsers()])
      setRoles(rolesData)
      setUsers(usersData)
    } catch (err) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async (e) => {
    e.preventDefault()
    try {
      await createRole(formData)
      setShowCreateForm(false)
      setFormData({ name: "", displayName: "", description: "", permissions: [] })
      loadData()
    } catch (err) {
      setError(err.message || "Failed to create role")
    }
  }

  const handleUpdateRole = async (e) => {
    e.preventDefault()
    try {
      await updateRole(editingRole._id, formData)
      setEditingRole(null)
      setFormData({ name: "", displayName: "", description: "", permissions: [] })
      loadData()
    } catch (err) {
      setError(err.message || "Failed to update role")
    }
  }

  const handleAssignRole = async (e) => {
    e.preventDefault()
    try {
      await assignRole(assignData.userId, assignData.roleId)
      setShowAssignForm(false)
      setAssignData({ userId: "", roleId: "" })
      loadData()
    } catch (err) {
      setError(err.message || "Failed to assign role")
    }
  }

  const startEdit = (role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
    })
  }

  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const formatPermission = (permission) => {
    const parts = permission.split(":")
    if (parts.length < 2) return permission

    const [module, action, scope] = parts

    // Capitalize first letter of each word
    const formatWord = (word) => word.charAt(0).toUpperCase() + word.slice(1)

    const moduleFormatted = formatWord(module)
    const actionFormatted = formatWord(action)

    let scopeFormatted = ""
    if (scope) {
      switch (scope.toLowerCase()) {
        case "own":
          scopeFormatted = " (Own)"
          break
        case "others":
          scopeFormatted = " (Others)"
          break
        case "team":
          scopeFormatted = " (Team)"
          break
        case "all":
          scopeFormatted = " (All)"
          break
        default:
          scopeFormatted = ` (${formatWord(scope)})`
      }
    }

    return `${moduleFormatted} → ${actionFormatted}${scopeFormatted}`
  }

  const showAllPermissions = (role) => {
    setSelectedRolePermissions(role.permissions || [])
    setSelectedRoleName(role.displayName || role.name)
    setShowPermissionModal(true)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            backgroundColor: "white",
            padding: "3rem",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            maxWidth: "24rem",
            width: "90%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                animation: "spin 2s linear infinite",
              }}
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 157 148"
                style={{ width: "100%", height: "100%" }}
              >
                <path
                  d="M0 0 C51.81 0 103.62 0 157 0 C157 48.84 157 97.68 157 148 C105.19 148 53.38 148 0 148 C0 99.16 0 50.32 0 0 Z "
                  fill="#FEFEFE"
                  transform="translate(0,0)"
                />
                <path
                  d="M0 0 C0.72597382 0.36480972 1.45194763 0.72961945 2.19992065 1.10548401 C3.03073151 1.51938889 3.86154236 1.93329376 4.7175293 2.35974121 C5.60101044 2.80765518 6.48449158 3.25556915 7.39474487 3.71705627 C8.77181107 4.40699425 8.77181107 4.40699425 10.17669678 5.11087036 C12.11293172 6.08234331 14.04772767 7.05668892 15.98117065 8.03370667 C18.94276116 9.5300918 21.90854332 11.01788103 24.87521362 12.50416565 C26.75697452 13.44963083 28.63849333 14.39557802 30.51974487 15.34205627 C31.40727448 15.78794601 32.29480408 16.23383575 33.20922852 16.6932373 C34.03373505 17.11029434 34.85824158 17.52735138 35.70773315 17.95704651 C36.43211578 18.32265182 37.15649841 18.68825714 37.90283203 19.06494141 C39.82443237 20.09596252 39.82443237 20.09596252 42.82443237 22.09596252 C43.21211243 23.93045044 43.21211243 23.93045044 43.22848511 26.18409729 C43.24116928 27.03000931 43.25385345 27.87592133 43.266922 28.74746704 C43.26398636 29.66813461 43.26105072 30.58880219 43.25802612 31.53736877 C43.26326797 32.49304245 43.26850983 33.44871613 43.27391052 34.43334961 C43.28035018 36.46858246 43.27896875 38.50385243 43.27047729 40.53907776 C43.26210741 43.59456409 43.29046975 46.64808996 43.32247925 49.7033844 C43.37783123 64.60203959 42.33531797 79.28928145 34.94943237 92.59596252 C34.42627441 93.58427063 34.42627441 93.58427063 33.89254761 94.59254456 C25.69015766 109.85324253 15.06647809 120.44012456 0.82443237 130.09596252 C-0.04697388 130.71600159 -0.91838013 131.33604065 -1.81619263 131.97486877 C-4.17556763 133.09596252 -4.17556763 133.09596252 -6.57009888 133.06471252 C-10.06079802 131.76682139 -12.89305687 129.79226957 -15.86306763 127.59596252 C-16.47811157 127.14599915 -17.09315552 126.69603577 -17.72683716 126.23243713 C-27.15271141 119.24098704 -34.72976668 111.96609523 -41.17556763 102.09596252 C-41.79431763 101.15881409 -42.41306763 100.22166565 -43.05056763 99.25611877 C-51.40802626 85.83735437 -54.35896259 72.13647113 -54.27322388 56.47096252 C-54.27180893 55.48346008 -54.27039398 54.49595764 -54.26893616 53.47853088 C-54.2633769 50.35097616 -54.25083208 47.2234953 -54.23806763 44.09596252 C-54.23304736 41.96445315 -54.22848537 39.83294264 -54.22439575 37.70143127 C-54.21342084 32.49958352 -54.19672375 27.2977783 -54.17556763 22.09596252 C-31.1110022 9.92238809 -31.1110022 9.92238809 -20.30056763 4.40846252 C-19.69712524 4.09304504 -19.09368286 3.77762756 -18.47195435 3.45265198 C-16.6951247 2.52492048 -14.90812381 1.61675097 -13.12088013 0.70924377 C-12.09494751 0.18113098 -11.06901489 -0.34698181 -10.01199341 -0.89109802 C-6.18221433 -2.25878208 -3.70331646 -1.5388797 0 0 Z "
                  fill="#01BFF9"
                  transform="translate(84.17556762695313,7.9040374755859375)"
                />
                <path
                  d="M0 0 C22.11 0 44.22 0 67 0 C67 48.84 67 97.68 67 148 C44.23 148 21.46 148 -2 148 C1.06397865 144.93602135 3.69336527 142.69034806 7.1875 140.25 C27.75793887 125.3814467 40.66385321 104.99894408 45.57810974 79.87976074 C46.33134762 74.73826994 46.24364253 69.61590022 46.1953125 64.4296875 C46.1924826 63.26744659 46.18965271 62.10520569 46.18673706 60.90774536 C46.17562659 57.23005463 46.150539 53.55261595 46.125 49.875 C46.1149584 47.36719104 46.10583462 44.85937823 46.09765625 42.3515625 C46.07742688 36.23420199 46.03826019 30.11738 46 24 C30.82 16.41 15.64 8.82 0 1 C0 0.67 0 0.34 0 0 Z "
                  fill="#FEFEFE"
                  transform="translate(90,0)"
                />
                <path
                  d="M0 0 C2.10062775 1.10387648 4.20348866 2.2035141 6.30859375 3.29882812 C21.11368162 11.05118162 21.11368162 11.05118162 22.625 12.5625 C22.73925462 14.12910909 22.7845906 15.70081095 22.80200195 17.27148438 C22.82125481 18.78071472 22.82125481 18.78071472 22.84089661 20.32043457 C22.84828354 21.42125366 22.85567047 22.52207275 22.86328125 23.65625 C22.871353 24.79090698 22.87942474 25.92556396 22.88774109 27.09460449 C22.90161657 29.51243552 22.9123231 31.93028641 22.92016602 34.34814453 C22.93716919 37.99161248 22.98099739 41.63412234 23.02539062 45.27734375 C23.1128444 58.2649548 22.61839506 70.15214495 18.625 82.5625 C18.35308838 83.41054199 18.08117676 84.25858398 17.80102539 85.13232422 C14.15965847 95.36912739 8.38714564 104.15042175 1.625 112.5625 C0.84253906 113.54089844 0.06007813 114.51929687 -0.74609375 115.52734375 C-7.07560481 122.93775653 -14.36848088 128.15759541 -22.375 133.5625 C-22.98859375 134.13355469 -23.6021875 134.70460937 -24.234375 135.29296875 C-30.01590266 138.72179446 -39.00202824 137.82395155 -45.375 136.5625 C-50.84004061 134.37160655 -55.0623185 130.46490428 -59.375 126.5625 C-60.34953125 125.75941406 -61.3240625 124.95632812 -62.328125 124.12890625 C-79.69198196 109.35992736 -91.06913748 88.12783042 -94.375 65.5625 C-94.6244144 61.36883516 -94.60945059 57.19202925 -94.5703125 52.9921875 C-94.5674826 51.82994659 -94.56465271 50.66770569 -94.56173706 49.47024536 C-94.55062659 45.79255463 -94.525539 42.11511595 -94.5 38.4375 C-94.4899584 35.92969104 -94.48083462 33.42187823 -94.47265625 30.9140625 C-94.45071722 24.79679037 -94.41733165 18.6796632 -94.375 12.5625 C-93.87143982 12.29950104 -93.36787964 12.03650208 -92.84906006 11.76553345 C-90.47657564 10.52513047 -88.10528021 9.2824814 -85.734375 8.0390625 C-84.8670575 7.58439606 -83.99973999 7.12972961 -83.10614014 6.6612854 C-78.09236676 4.02322811 -73.12995591 1.32009633 -68.203125 -1.4765625 C-66.01101021 -2.67296318 -63.81831592 -3.86830275 -61.625 -5.0625 C-60.56796875 -5.68511719 -59.5109375 -6.30773437 -58.421875 -6.94921875 C-37.81452285 -17.90289308 -18.98959744 -10.40022663 0 0 Z "
                  fill="#AFC9EC"
                  transform="translate(114.375,11.4375)"
                />
                <path
                  d="M0 0 C3.96 1.98 7.92 3.96 12 6 C12.10024123 12.0973655 12.17210451 18.19423241 12.21972656 24.29223633 C12.23961672 26.35872776 12.26673874 28.42516465 12.30175781 30.49145508 C12.56571059 46.48776995 12.0885774 62.15252829 4.125 76.5 C3.60184204 77.48830811 3.60184204 77.48830811 3.06811523 78.49658203 C-5.83058815 95.05278402 -18.37694585 108.03774839 -35 117 C-39.8937524 117 -43.30123195 113.88866323 -47 111 C-44.00857271 107.70942998 -40.93336057 105.18897229 -37.25 102.6875 C-17.47906414 89.07664801 -6.02550887 70.11231505 -1.43531799 46.74874878 C-0.73121687 42.30281008 -0.64293288 37.89262497 -0.5859375 33.3984375 C-0.56657135 32.435961 -0.5472052 31.4734845 -0.5272522 30.48184204 C-0.46808427 27.44631455 -0.42132519 24.41074782 -0.375 21.375 C-0.33676228 19.30076588 -0.29770731 17.22654666 -0.2578125 15.15234375 C-0.16243539 10.10168532 -0.07817632 5.05095276 0 0 Z "
                  fill="#07A9F1"
                  transform="translate(115,24)"
                />
                <path
                  d="M0 0 C4.30212789 2.22555966 6.88248625 4.92597491 8.8046875 9.30859375 C9.75349458 16.98708401 9.4875847 22.01595064 4.8046875 28.30859375 C4.5106698 33.90093035 5.06866202 39.2182367 5.8671875 44.74609375 C6.23144471 47.2687446 6.5446888 49.77136508 6.8046875 52.30859375 C5.8046875 53.30859375 5.8046875 53.30859375 3.21264648 53.42211914 C2.08673096 53.41688232 0.96081543 53.41164551 -0.19921875 53.40625 C-1.41416016 53.40302734 -2.62910156 53.39980469 -3.88085938 53.39648438 C-5.16025391 53.38810547 -6.43964844 53.37972656 -7.7578125 53.37109375 C-9.04107422 53.36658203 -10.32433594 53.36207031 -11.64648438 53.35742188 C-14.82947272 53.3455892 -18.01237012 53.32910443 -21.1953125 53.30859375 C-22.09295185 49.30810739 -22.06726212 46.53276082 -21.2578125 42.49609375 C-20.3848418 37.58939635 -19.68114874 33.27884339 -20.1953125 28.30859375 C-20.8553125 27.42171875 -21.5153125 26.53484375 -22.1953125 25.62109375 C-25.33652135 20.4184666 -25.05048846 15.22847564 -24.1953125 9.30859375 C-20.05560636 -0.6504534 -9.79070032 -3.08354797 0 0 Z "
                  fill="#0356A3"
                  transform="translate(86.1953125,45.69140625)"
                />
                <path
                  d="M0 0 C3.62805255 0.58307987 5.60874874 1.33210617 8.5 3.5625 C11.01250583 7.33125875 11.03016086 9.09400134 10.5 13.5625 C9.06285124 16.00939268 7.56689742 17.54481442 5.5 19.5625 C4.84 19.5625 4.18 19.5625 3.5 19.5625 C3.66757813 20.14257812 3.83515625 20.72265625 4.0078125 21.3203125 C5.335278 26.4117308 5.79125276 29.59811901 3.5 34.5625 C4.49 34.8925 5.48 35.2225 6.5 35.5625 C6.5 36.8825 6.5 38.2025 6.5 39.5625 C4.16705225 39.60491723 1.83297433 39.60342937 -0.5 39.5625 C-1.5 38.5625 -1.5 38.5625 -1.61352539 36.70483398 C-1.60828857 35.91407471 -1.60305176 35.12331543 -1.59765625 34.30859375 C-1.59443359 33.45458984 -1.59121094 32.60058594 -1.58789062 31.72070312 C-1.57951172 30.82287109 -1.57113281 29.92503906 -1.5625 29 C-1.55798828 28.09830078 -1.55347656 27.19660156 -1.54882812 26.26757812 C-1.53700225 24.03248686 -1.5205222 21.79752563 -1.5 19.5625 C-2.12390625 19.26730469 -2.7478125 18.97210938 -3.390625 18.66796875 C-6.04163967 17.27864069 -7.07292985 16.20257977 -8.5 13.5625 C-9.12486465 9.34466364 -8.90938679 5.94721692 -6.4375 3.125 C-3.5 0.5625 -3.5 0.5625 0 0 Z "
                  fill="#D5EEF8"
                  transform="translate(77.5,51.4375)"
                />
                <path
                  d="M0 0 C0.33 0 0.66 0 1 0 C1.03867187 1.19496094 1.03867187 1.19496094 1.078125 2.4140625 C1.43018071 8.99110332 2.16242853 12.55312436 6 18 C6.7011512 24.77779493 5.2432551 31.33970483 4 38 C0.93719986 36.677131 -0.73694379 35.43431726 -2.625 32.6875 C-3.02976563 32.11386719 -3.43453125 31.54023437 -3.8515625 30.94921875 C-7.46786456 24.81134553 -7.87542517 18.99473376 -7 12 C-5.37759706 7.47054048 -3.41879672 3.41879672 0 0 Z "
                  fill="#F2BF4C"
                  transform="translate(61,56)"
                />
                <path
                  d="M0 0 C4.92311531 4.39088663 7.5214169 8.27651827 8.35546875 14.765625 C8.7715314 23.53667556 6.413454 29.90385521 0.8125 36.625 C-1 38 -1 38 -3 38 C-5.61806656 23.97464342 -5.61806656 23.97464342 -5 18 C-4.0409375 16.63875 -4.0409375 16.63875 -3.0625 15.25 C-0.01266225 10.44419506 -0.1808554 5.58843187 0 0 Z "
                  fill="#F2BF4B"
                  transform="translate(95,56)"
                />
                <path
                  d="M0 0 C1.98 0.495 1.98 0.495 4 1 C4 6.61 4 12.22 4 18 C2.68 18.33 1.36 18.66 0 19 C-1.8855253 17.1144747 -1.13246689 14.42231169 -1.13671875 11.91796875 C-1.13285156 11.12003906 -1.12898438 10.32210937 -1.125 9.5 C-1.12886719 8.70207031 -1.13273437 7.90414062 -1.13671875 7.08203125 C-1.12660767 1.12660767 -1.12660767 1.12660767 0 0 Z "
                  fill="#07AAF1"
                  transform="translate(77,105)"
                />
                <path
                  d="M0 0 C1.98 0.495 1.98 0.495 4 1 C4 6.61 4 12.22 4 18 C2.68 18.33 1.36 18.66 0 19 C-1.8855253 17.1144747 -1.13246689 14.42231169 -1.13671875 11.91796875 C-1.13285156 11.12003906 -1.12898438 10.32210938 -1.125 9.5 C-1.12886719 8.70207031 -1.13273437 7.90414063 -1.13671875 7.08203125 C-1.12660767 1.12660767 -1.12660767 1.12660767 0 0 Z "
                  fill="#07AAF1"
                  transform="translate(77,18)"
                />
                <path
                  d="M0 0 C2.5 0.25 2.5 0.25 4.5 2.25 C4.75 5.25 4.75 5.25 4.5 8.25 C3.84 8.91 3.18 9.57 2.5 10.25 C-3.06818182 9.68181818 -3.06818182 9.68181818 -4.5 8.25 C-4.6875 5.3125 -4.6875 5.3125 -4.5 2.25 C-2.5 0.25 -2.5 0.25 0 0 Z "
                  fill="#0A56A4"
                  transform="translate(78.5,56.75)"
                />
              </svg>
            </div>
          </div>
          <p style={{ marginTop: "0.5rem", color: "#374151", fontWeight: "600", fontSize: "1.125rem" }}>
            Loading roles...
          </p>
          <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
            Please wait while we fetch your role data
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    )
  }

  if (error && !currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            maxWidth: "28rem",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "4rem",
              backgroundColor: "#fef2f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <span style={{ color: "#dc2626", fontSize: "1.5rem" }}>⚠️</span>
          </div>
          <p style={{ color: "#dc2626", marginBottom: "1.5rem", fontWeight: "500" }}>{error}</p>
          <button
            onClick={() => navigate("/admin-dashboard")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        color: "white",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <header style={{ backgroundColor: "#334155", padding: "1rem 0", borderBottom: "1px solid #475569" }}>
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "0.75rem",
              }}
            >
              <span style={{ color: "white", fontWeight: "bold", fontSize: "1.125rem" }}>R</span>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>Role Management</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Welcome, Admin User</span>
            <button
              onClick={() => navigate("/admin-dashboard")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
            >
              📊 Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "2rem 1rem",
          minHeight: "calc(100vh - 80px)", // Account for header height
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "80rem",
            margin: "0 auto",
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                backgroundColor: "#fef2f2",
                borderRadius: "0.5rem",
                border: "1px solid #fecaca",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem", justifyContent: "flex-start" }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
            >
              + Create New Role
            </button>
            <button
              onClick={() => setShowAssignForm(true)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
            >
              👤 Assign Role
            </button>
          </div>

          {/* Role Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {roles.map((role) => (
              <div
                key={role._id}
                style={{
                  backgroundColor: "#334155",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  border: "1px solid #475569",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flex: 1 }}>
                    {/* Role Icon */}
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        backgroundColor: "#3b82f6",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "white", fontWeight: "bold", fontSize: "1.25rem" }}>
                        {role.displayName?.charAt(0) || role.name?.charAt(0) || "R"}
                      </span>
                    </div>

                    {/* Role Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "white" }}>
                          {role.displayName || role.name}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>@{role.name}</p>
                      </div>

                      <p style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "1rem", lineHeight: "1.5" }}>
                        {role.description}
                      </p>

                      {/* Permissions */}
                      <div style={{ marginBottom: "1rem" }}>
                        <p
                          style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: "500" }}
                        >
                          Permissions ({role.permissions?.length || 0})
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {role.permissions?.slice(0, 4).map((permission) => (
                            <span
                              key={permission}
                              style={{
                                padding: "0.25rem 0.75rem",
                                backgroundColor: "#475569",
                                color: "#e2e8f0",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                              }}
                            >
                              {permission}
                            </span>
                          ))}
                          {role.permissions?.length > 4 && (
                            <span
                              onClick={() => showAllPermissions(role)}
                              style={{
                                padding: "0.25rem 0.75rem",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#2563eb"
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#3b82f6"
                              }}
                            >
                              +{role.permissions.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(role)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          backgroundColor: "#475569",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#64748b")}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#475569")}
                      >
                        ✏️ Edit Role
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      {(showCreateForm || editingRole) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              maxWidth: "32rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    backgroundColor: "#dbeafe",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                  }}
                >
                  <span style={{ color: "#2563eb", fontSize: "0.875rem" }}>{editingRole ? "✏️" : "+"}</span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
                  {editingRole ? "Edit Role" : "Create New Role"}
                </h3>
              </div>
              <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Role Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      placeholder="e.g., admin, manager, user"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#3b82f6"
                        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db"
                        e.target.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      placeholder="e.g., Administrator, Task Manager, Regular User"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#3b82f6"
                        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db"
                        e.target.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        resize: "vertical",
                        minHeight: "5rem",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      placeholder="Describe the role and its responsibilities..."
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#3b82f6"
                        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db"
                        e.target.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Permissions
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0.75rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={() => handlePermissionChange(permission)}
                            style={{
                              marginRight: "0.75rem",
                              width: "1rem",
                              height: "1rem",
                              accentColor: "#3b82f6",
                            }}
                          />
                          <span style={{ fontSize: "0.875rem", color: "#374151", fontWeight: "500" }}>
                            {permission}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingRole(null)
                      setFormData({ name: "", displayName: "", description: "", permissions: [] })
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      color: "#374151",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#f3f4f6")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              maxWidth: "28rem",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    backgroundColor: "#dcfce7",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                  }}
                >
                  <span style={{ color: "#16a34a", fontSize: "0.875rem" }}>👤</span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
                  Assign Role to User
                </h3>
              </div>
              <form onSubmit={handleAssignRole}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Select User
                    </label>
                    <select
                      value={assignData.userId}
                      onChange={(e) => setAssignData((prev) => ({ ...prev, userId: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        backgroundColor: "white",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10b981"
                        e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db"
                        e.target.style.boxShadow = "none"
                      }}
                    >
                      <option value="">Choose a user...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Select Role
                    </label>
                    <select
                      value={assignData.roleId}
                      onChange={(e) => setAssignData((prev) => ({ ...prev, roleId: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        backgroundColor: "white",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10b981"
                        e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db"
                        e.target.style.boxShadow = "none"
                      }}
                    >
                      <option value="">Choose a role...</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.displayName} ({role.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignForm(false)
                      setAssignData({ userId: "", roleId: "" })
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      color: "#374151",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#f3f4f6")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#10b981",
                      color: "white",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
                  >
                    Assign Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPermissionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPermissionModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "2rem",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", margin: 0 }}>
                {selectedRoleName} Permissions
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0.25rem",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 1rem 0" }}>
                Total permissions: {selectedRolePermissions.length}
              </p>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {selectedRolePermissions.map((permission, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "500", color: "#1f2937" }}>{formatPermission(permission)}</span>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>{permission}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                onClick={() => setShowPermissionModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleManagement
