const baseUrl = process.env.API_BASE_URL || "http://127.0.0.1:5101/api";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const request = async (path, options = {}) => {
  const { headers, ...restOptions } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(headers || {})
    },
    ...restOptions
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { status: response.status, body };
};

const run = async () => {
  const stamp = Date.now();
  const testUser = {
    username: `smoke_${stamp}`,
    email: `smoke_${stamp}@example.com`,
    password: "pass1234"
  };

  const health = await request("/health");
  assert(health.status === 200, `Health check failed: ${health.status}`);

  const register = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(testUser)
  });
  assert(register.status === 201, `Register failed: ${register.status} ${JSON.stringify(register.body)}`);
  assert(register.body?.token, "Register did not return token");
  assert(register.body?.user?.email === testUser.email, "Register returned unexpected user");
  assert(!register.body?.user?.password, "Register should not return password");

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: testUser.email.toUpperCase(),
      password: testUser.password
    })
  });
  assert(login.status === 200, `Login failed: ${login.status} ${JSON.stringify(login.body)}`);
  assert(login.body?.token, "Login did not return token");
  assert(login.body?.user?.email === testUser.email, "Login returned unexpected user");

  const token = login.body.token;

  const profile = await request("/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert(profile.status === 200, `Profile failed: ${profile.status} ${JSON.stringify(profile.body)}`);

  const leaderboard = await request("/leaderboard");
  assert(leaderboard.status === 200, `Leaderboard failed: ${leaderboard.status}`);

  const createRoom = await request("/rooms/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type: "private" })
  });
  assert(createRoom.status === 201, `Create room failed: ${createRoom.status} ${JSON.stringify(createRoom.body)}`);
  assert(createRoom.body?.roomCode, "Create room did not return room code");

  const publicRooms = await request("/rooms/public", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert(publicRooms.status === 200, `Public rooms failed: ${publicRooms.status}`);

  const matches = await request(`/matches/${login.body.user._id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert(matches.status === 200, `Matches failed: ${matches.status}`);

  console.log("API smoke test passed");
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
