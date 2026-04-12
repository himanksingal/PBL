// // This is redundant as Bulk Upload CSV is removed


// import { env } from '../config/env.js'

// let adminTokenCache = {
//   token: null,
//   expiresAt: 0,
// }

// const baseUrl = () => `${env.keycloakUrl.replace(/\/$/, '')}`
// const realm = () => env.keycloakRealm
// const clientId = () => env.keycloakAdminClientId
// const clientSecret = () => env.keycloakAdminClientSecret

// export async function getAdminToken() {
//   if (!clientId() || !clientSecret() || !realm() || !baseUrl()) {
//     throw new Error('Keycloak Admin API is not properly configured in environments.')
//   }

//   // Grace period of 10 seconds to ensure token doesn't expire precisely during the REST call
//   if (adminTokenCache.token && Date.now() < adminTokenCache.expiresAt - 10000) {
//     return adminTokenCache.token
//   }

//   const tokenEndpoint = `${baseUrl()}/realms/${realm()}/protocol/openid-connect/token`

//   const response = await fetch(tokenEndpoint, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({
//       client_id: clientId(),
//       client_secret: clientSecret(),
//       grant_type: 'client_credentials',
//     }),
//   })

//   if (!response.ok) {
//     const errorBody = await response.text()
//     throw new Error(`Failed to fetch Keycloak admin token: ${errorBody}`)
//   }

//   const data = await response.json()
//   adminTokenCache.token = data.access_token
//   adminTokenCache.expiresAt = Date.now() + data.expires_in * 1000

//   return adminTokenCache.token
// }

// async function requestAdminApi(method, path, body = null) {
//   const token = await getAdminToken()
//   const url = `${baseUrl()}/admin/realms/${realm()}${path}`

//   const options = {
//     method,
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//   }

//   if (body) {
//     options.body = JSON.stringify(body)
//   }

//   const response = await fetch(url, options)

//   // 201 Created and 204 No Content usually don't have bodies
//   if (response.status === 201 || response.status === 204) {
//     return null
//   }

//   if (!response.ok) {
//     const errorText = await response.text()
//     throw new Error(`Keycloak Admin API Error [${method} ${path}]: ${response.status} - ${errorText}`)
//   }

//   return response.json()
// }

// // 
// // Keycloak Admin APIs
// // 

// export async function getUserByRegistrationNumber(registrationNumber) {
//   const users = await requestAdminApi('GET', `/users?username=${encodeURIComponent(registrationNumber)}&exact=true`)
//   if (!users || users.length === 0) return null
//   return users[0]
// }

// export async function createUser(payload) {
//   const { registrationNumber, email, firstName, lastName, password, enabled = true } = payload

//   const userPayload = {
//     username: registrationNumber,
//     email: email || undefined,
//     firstName: firstName || undefined,
//     lastName: lastName || undefined,
//     enabled,
//     attributes: {
//       registration_number: [registrationNumber]
//     }
//   }

//   if (password) {
//     userPayload.credentials = [{
//       type: 'password',
//       value: password,
//       temporary: true
//     }]
//   }

//   try {
//     await requestAdminApi('POST', '/users', userPayload)
//     console.log(`[keycloak] Created new user: ${registrationNumber}`)
//   } catch (err) {
//     if (err.message.includes('409')) {
//       console.log(`[keycloak] User ${registrationNumber} already exists (409 Conflict).`)
//     } else {
//       throw err
//     }
//   }

//   const user = await getUserByRegistrationNumber(registrationNumber)
//   if (!user) {
//      throw new Error(`Failed to reconcile Keycloak user ${registrationNumber} after creation attempt.`);
//   }

//   return user.id
// }

// export async function updateUser(keycloakUserId, payload) {
//   const { email, firstName, lastName, enabled = true } = payload
  
//   await requestAdminApi('PUT', `/users/${keycloakUserId}`, {
//     email: email || undefined,
//     firstName: firstName || undefined,
//     lastName: lastName || undefined,
//     enabled
//   })
// }

// export async function getUserGroups(keycloakUserId) {
//   const groups = await requestAdminApi('GET', `/users/${keycloakUserId}/groups`)
//   return groups || []
// }

// export async function removeGroup(keycloakUserId, groupId) {
//   try {
//     await requestAdminApi('DELETE', `/users/${keycloakUserId}/groups/${groupId}`)
//   } catch (err) {
//     throw err
//   }
// }

// export async function setTemporaryPassword(keycloakUserId, newPassword) {
//   await requestAdminApi('PUT', `/users/${keycloakUserId}/reset-password`, {
//     type: 'password',
//     value: newPassword,
//     temporary: true,
//   })
// }

// // Ensure the group exists or find it
// export async function getGroupPath(groupPath) {
//   const search = groupPath.split('/').pop()
//   const groups = await requestAdminApi('GET', `/groups?search=${encodeURIComponent(search)}&exact=true`)
  
//   const findGroupRecursively = (groupsList, currentPath) => {
//     for (const group of groupsList) {
//       if (group.path === currentPath) return group
//       if (group.subGroups && group.subGroups.length > 0) {
//         const found = findGroupRecursively(group.subGroups, currentPath)
//         if (found) return found
//       }
//     }
//     return null
//   }

//   const foundGroup = findGroupRecursively(groups, groupPath)
//   return foundGroup ? foundGroup.id : null
// }

// export async function assignGroup(keycloakUserId, groupPath) {
//   const groupId = await getGroupPath(groupPath)
//   if (!groupId) {
//     throw new Error(`Group not found in Keycloak: ${groupPath}`)
//   }

//   // Idempotent
//   try {
//     await requestAdminApi('PUT', `/users/${keycloakUserId}/groups/${groupId}`)
//   } catch (err) {
//       // Keycloak responds with an error if user is already in group depending on API version, but typically 204.
//       // If error, bubble up unless we can identify we're already assigned.
//       throw err;
//   }
// }
