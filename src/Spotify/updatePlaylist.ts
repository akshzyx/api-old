// import fetch from "node-fetch";

// import { errorLogger } from "../misc";

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export async function updatePlaylist(accessToken: string, playlistID: string, description: string): Promise<string> {
//   const req = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
//     method: "PUT",
//     headers: {
//       "Authorization": `Bearer ${accessToken}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       description: description
//     })
//   });
//   // if (req.status === 429) { // if rate limited
//   //   errorLogger(`rate limited! (updatePlaylist) - retry: ${req.headers.get("Retry-After")}`);
//   //   await sleep(parseInt(req.headers.get("Retry-After")) + 3);
//   // } else
//   if (req.status !== 200) { // if request not 200
//     const makeResJson = await req.json();
//     errorLogger(`unexpected error! (playlistsync updatereq)\nstatus: ${req.status}\nerror: ${JSON.stringify(makeResJson, null, " ")}`);
//   } else {
//     return "success!";
//   }
// }
