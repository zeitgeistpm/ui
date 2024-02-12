import { NextApiRequest, NextApiResponse } from "next";
const SibApiV3Sdk = require("@getbrevo/brevo");

export default async function onboardUser(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  //change this value to match corresponding list id in Brevo
  const listId = 37;
  const userEmail = request.body.email;
  const userName = request.body.name;

  const apiInstance = new SibApiV3Sdk.ContactsApi();
  const apiKey = apiInstance.authentications["apiKey"];
  apiKey.apiKey = process.env.BREVO_API;

  const createContact = new SibApiV3Sdk.CreateContact();
  createContact.attributes = { NAME: userName };
  createContact.email = userEmail;
  createContact.listIds = [listId];

  const contactEmails = new SibApiV3Sdk.AddContactToList();
  contactEmails.emails = [request.body.email];

  try {
    const contactInfo = await apiInstance.getContactInfo(userEmail);
    if (contactInfo.body.email) {
      try {
        await apiInstance.addContactToList(listId, contactEmails);
        return response
          .status(200)
          .json({ success: true, message: "Contact added to list" });
      } catch (error) {
        return response
          .status(400)
          .json({ success: false, message: "Contact already in list" });
      }
    }
  } catch (error) {
    try {
      await apiInstance.createContact(createContact);
      return response.status(200).json({
        success: true,
        message: "Contact created and added to list",
      });
    } catch (error) {
      return response
        .status(400)
        .json({ success: false, message: "Error creating contact" });
    }
  }
}
