const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && path !== "/login" && path !== "/register" && path !== "/refresh") {
    // Attempt token refresh
    try {
      const refreshResult = await auth.refresh();
      if (refreshResult && refreshResult.accessToken) {
        setAccessToken(refreshResult.accessToken);
        // Retry the original request
        headers.set("Authorization", `Bearer ${refreshResult.accessToken}`);
        const retryResponse = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => ({}));
          throw new Error(errData.message || "Request failed after token refresh");
        }
        return retryResponse.json();
      }
    } catch (refreshErr) {
      setAccessToken(null);
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Something went wrong");
  }

  return response.json();
}

export const auth = {
  async register(username: string, password: string) {
    return request("/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async login(username: string, password: string) {
    const data = await request("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      // Send credentials (cookies) to set refresh token
      credentials: "include",
    });
    if (data.token) {
      setAccessToken(data.token);
    }
    return data;
  },

  async refresh() {
    const data = await request("/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    return data;
  },

  async logout() {
    await request("/logout", {
      method: "POST",
      credentials: "include",
    });
    setAccessToken(null);
  },
};

export type Task = {
  _id: string;
  title: string;
  done: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const tasks = {
  async getAll(): Promise<Task[]> {
    return request("/tasks");
  },

  async create(title: string, done: boolean = false): Promise<Task> {
    return request("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, done }),
    });
  },

  async update(id: string, updates: Partial<Omit<Task, "_id">>): Promise<Task> {
    return request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return request(`/tasks/${id}`, {
      method: "DELETE",
    });
  },
};
