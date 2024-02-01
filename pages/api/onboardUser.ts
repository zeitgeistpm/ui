import { NextApiRequest, NextApiResponse } from "next";
const SibApiV3Sdk = require("@getbrevo/brevo");

export default function onboardUser(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();

  let apiKey = apiInstance.authentications["apiKey"];
  apiKey.apiKey = process.env.NEXT_PUBLIC_BREVO_API;

  let createContact = new SibApiV3Sdk.CreateContact();

  createContact.email = request.body.email;
  createContact.listIds = [37];

  apiInstance.createContact(createContact).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data),
      );
    },
    function (error) {
      console.error(error);
    },
  );

  let contactEmails = new SibApiV3Sdk.AddContactToList();

  contactEmails.emails = [request.body.email];
  let listId = 37;

  apiInstance.addContactToList(listId, contactEmails).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data),
      );
    },
    function (error) {
      console.error(error);
    },
  );

  // let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  // let apiKey = apiInstance.authentications["apiKey"];
  // apiKey.apiKey = process.env.NEXT_PUBLIC_BREVO_API;

  // let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  // console.log("EMAIL: " + request.body);
  // sendSmtpEmail = {
  //   to: [
  //     {
  //       email: "rob@zeitgeist.pm",
  //       name: "Rob H",
  //     },
  //   ],
  //   templateId: 47,
  //   params: {
  //     name: "Rob",
  //     surname: "H",
  //   },
  //   headers: {
  //     "X-Mailin-custom":
  //       "custom_header_1:custom_value_1|custom_header_2:custom_value_2",
  //   },
  // };

  // apiInstance.sendTransacEmail(sendSmtpEmail).then(
  //   function (data) {
  //     console.log("API called successfully. Returned data: " + data);
  //     response.status(200).json({
  //       body: {
  //         data: data,
  //       },
  //     });
  //   },
  //   function (error) {
  //     console.error(error);
  //   },
  // );
}
