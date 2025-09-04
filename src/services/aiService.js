import API from "../api"

export async function enhanceTaskDescription({ title, description }) {
  const { data } = await API.post("/tasks/enhance-description", {
    title,
    description,
  })
  // expected: { enhancedDescription: string }
  return data
}
