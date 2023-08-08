import { Tab } from "@headlessui/react";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { NextPage } from "next";

type Method = "buy" | "deposit";

const CreateAccountPage: NextPage = () => {
  const [method, setMethod] = useQueryParamState<Method>("method");
  const [currency, setCurrency] = useQueryParamState<string>("currency");
  return (
    <>
      <Tab.Group></Tab.Group>
    </>
  );
};

export default CreateAccountPage;
