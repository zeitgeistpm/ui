import { NextApiRequest, NextApiResponse } from "next";
import * as jose from "jose";

const SibApiV3Sdk = require("@getbrevo/brevo");

export default async function onboardUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  //verify user auth
  try {
    const idToken = req.headers.authorization?.split(" ")[1] || "";
    const app_pub_key = req.body.appPubKey;
    const jwks = jose.createRemoteJWKSet(
      new URL("https://api.openlogin.com/jwks"),
    );
    const jwtDecoded = await jose.jwtVerify(idToken, jwks, {
      algorithms: ["ES256"],
    });

    if ((jwtDecoded.payload as any).wallets[0].public_key == app_pub_key) {
      // verified
      const listId = 37; //change this value to match corresponding list id in Brevo
      const userEmail = req.body.email;
      const userName = req.body.name;

      const apiInstance = new SibApiV3Sdk.ContactsApi();
      const apiKey = apiInstance.authentications["apiKey"];
      apiKey.apiKey = process.env.BREVO_API;

      const createContact = new SibApiV3Sdk.CreateContact();
      createContact.attributes = { NAME: userName };
      createContact.email = userEmail;
      createContact.listIds = [listId];

      const contactEmails = new SibApiV3Sdk.AddContactToList();
      contactEmails.emails = [req.body.email];

      try {
        const contactInfo = await apiInstance.getContactInfo(userEmail);
        if (contactInfo.body.email) {
          try {
            await apiInstance.addContactToList(listId, contactEmails);
            return res
              .status(200)
              .json({ success: true, message: "Contact added to list" });
          } catch (error) {
            return res
              .status(400)
              .json({ success: false, message: "Contact already in list" });
          }
        }
      } catch (error) {
        try {
          await apiInstance.createContact(createContact);
          return res.status(200).json({
            success: true,
            message: "Contact created and added to list",
          });
        } catch (error) {
          return res
            .status(400)
            .json({ success: false, message: "Error creating contact" });
        }
      }
    } else {
      // verification failed
      res.status(401).json({ name: "Validation Failed" });
      console.log("Validation Failed");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
