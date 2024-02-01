import { NextApiRequest, NextApiResponse } from "next";

export default function onboardEmail(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const SibApiV3Sdk = require("sib-api-v3-sdk");
  const defaultClient = SibApiV3Sdk.ApiClient.instance;

  let apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.NEXT_PUBLIC_BREVO_API;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail = {
    to: [
      {
        email: "rob@zeitgeist.pm",
        name: "Rob H",
      },
    ],
    templateId: 47,
    params: {
      name: "Rob",
      surname: "H",
    },
    headers: {
      "X-Mailin-custom":
        "custom_header_1:custom_value_1|custom_header_2:custom_value_2",
    },
  };

  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function (data) {
      console.log("API called successfully. Returned data: " + data);
      response.status(200).json({
        body: {
          data: data,
        },
      });
    },
    function (error) {
      console.error(error);
    },
  );
}
