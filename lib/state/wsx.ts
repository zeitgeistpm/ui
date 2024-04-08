export const checkNewUser = async (
  userAddress: string,
  idToken: string,
  appPubKey: string,
) => {
  try {
    const response = await fetch("/api/checkNewUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ userAddress, appPubKey }),
    });

    const data = await response.json();
    if (data.success) {
      return { success: data };
    } else {
      return { error: data.error };
    }
  } catch (error) {
    return error;
  }
};
