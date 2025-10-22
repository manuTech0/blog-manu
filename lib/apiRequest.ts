import { GraphQLClient, gql } from "graphql-request"

export async function apiFetch(query: string, options?: { variables?: Record<string, any>, headers?: HeadersInit }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.manu-tech.my.id"
  const headers: HeadersInit = {
    // global Headers here
    ...options?.headers
  }
  const client = new GraphQLClient(apiUrl + "/graphql", {
    credentials: "include",
    mode: "cors",
    headers: headers,
  })
  const req = await client.request(gql`${query}`, { ...options?.variables })
  return {
    request: req
  }
}
