export const checkNewUser = async (userAddress: string) => {
  try {
    const response = await fetch("/api/checkNewUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userAddress }),
    });

    const data = await response.json();
    if (data.success) {
      return { success: data.success };
    } else {
      return { error: data.error };
    }
  } catch (error) {
    return error;
  }
};
