import { NextApiRequest, NextApiResponse } from "next";
const SibApiV3Sdk = require("@getbrevo/brevo");

export default async function onboardUser(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  //change this value to match corresponding list id in Brevo
  const listId = 37;
  const userEmail = request.body.email;

  const apiInstance = new SibApiV3Sdk.ContactsApi();
  const apiKey = apiInstance.authentications["apiKey"];
  apiKey.apiKey = process.env.NEXT_PUBLIC_BREVO_API;

  const createContact = new SibApiV3Sdk.CreateContact();
  createContact.name = request.body.name;
  createContact.email = request.body.email;
  createContact.listIds = [listId];

  const contactEmails = new SibApiV3Sdk.AddContactToList();
  contactEmails.emails = [request.body.email];

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
        .json({ success: false, message: "Contact already exists" });
    }
  } else {
    try {
      await apiInstance.createContact(createContact);
      return response
        .status(200)
        .json({ success: true, message: "Contact created and added to list" });
    } catch (error) {
      return response
        .status(400)
        .json({ success: false, message: "Error creating contact" });
    }
  }
}
