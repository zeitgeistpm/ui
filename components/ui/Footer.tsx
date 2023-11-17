import React, { FC } from "react";
import axios from "axios";
import Link from "next/link";
import { useNotifications } from "lib/state/notifications";
import { useForm } from "react-hook-form";
import { endpointOptions, isWSX } from "lib/constants";
import Input from "./Input";
import Image from "next/image";

const emailList = isWSX
  ? "https://emails.zeitgeist.pm/wsx-subscribe"
  : "https://emails.zeitgeist.pm/app-subscribe";

const FooterNewsletterSub: FC<{ title: string }> = ({ title }) => {
  const notificationStore = useNotifications();
  const { register, formState, handleSubmit, reset } = useForm();

  const invalid = formState.isValid === false && formState.isDirty;

  const subscribe = async ({ email }: { email: string }) => {
    try {
      const response = await axios.post(emailList, { email });

      response.status === 201
        ? notificationStore.pushNotification("Success! You're on the list.", {
            type: "Success",
          })
        : notificationStore.pushNotification("Email already exists.", {
            type: "Error",
          });
      reset();
    } catch {
      notificationStore.pushNotification(
        "Something went wrong, please try again.",
        { type: "Error" },
      );
    }
  };

  return (
    <form className="flex w-full flex-col" onSubmit={handleSubmit(subscribe)}>
      <h6 className="mb-[26px] font-semibold text-white">{title}</h6>
      <div className="mb-auto flex h-10 w-full items-center gap-3">
        <Input
          {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
          className={`h-full grow rounded-md border-[1px] bg-anti-flash-white p-2 text-ztg-12-120 text-sky-600 focus:outline-none ${
            invalid ? "border-vermilion" : "border-none"
          }`}
          type="email"
        />
        <button
          type="submit"
          className={`center h-full flex-shrink rounded-full bg-ztg-blue px-5 text-ztg-16-150 text-white ${
            invalid ? "cursor-default" : "cursor-pointer"
          } disabled:opacity-60`}
          disabled={invalid}
        >
          Send Email
        </button>
      </div>
    </form>
  );
};

interface FooterMenuProps {
  title: string;
  links: { text: string; href: string }[];
  className?: string;
}

const FooterMenu: FC<FooterMenuProps> = ({ title, links, className = "" }) => {
  return (
    <div className={`${className}`}>
      <h6 className="mb-1 font-semibold text-white">{title}</h6>
      <div className="flex flex-col text-ztg-14-150 text-sky-600">
        {links.map(({ text, href }, idx) => {
          return (
            <Link
              href={href}
              key={`footerMenuLink${idx}`}
              target="_blank"
              className="mb-0.5"
            >
              <span>{text}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const FooterMenus = () => {
  return (
    <>
      {isWSX ? (
        <div className="grid w-full grid-cols-3 gap-7">
          <FooterMenu
            className="col-span-1"
            title="General"
            links={[{ text: "Website", href: "https://zeitgeist.pm" }]}
          />
          <FooterMenu
            className="col-span-1"
            title="Community"
            links={[
              { text: "Discord", href: "https://discord.gg/xv8HuA4s8v" },
              { text: "Telegram", href: "https://t.me/zeitgeist_official" },
              { text: "Twitter", href: "https://twitter.com/ZeitgeistPM" },
            ]}
          />
        </div>
      ) : (
        <div className="flex w-full justify-between gap-7">
          <FooterMenu
            title="General"
            links={[
              {
                text: "Apps (Advanced UI)",
                href: `https://polkadot.js.org/apps/?rpc=${endpointOptions[0].value}`,
              },
              { text: "Website", href: "https://zeitgeist.pm" },
            ]}
          />
          <FooterMenu
            title="Technology"
            links={[
              { text: "Documentation", href: "https://docs.zeitgeist.pm" },
              { text: "Github", href: "https://github.com/zeitgeistpm" },
            ]}
          />
          <FooterMenu
            title="Community"
            links={[
              { text: "Discord", href: "https://discord.gg/xv8HuA4s8v" },
              { text: "Telegram", href: "https://t.me/zeitgeist_official" },
              { text: "Twitter", href: "https://twitter.com/ZeitgeistPM" },
            ]}
          />
        </div>
      )}
    </>
  );
};

const Footer = () => {
  return (
    <div className="mt-auto flex w-full flex-col bg-[#1C1C1C] pb-24 pt-12">
      <div className="container-fluid">
        <div className="mb-8 flex flex-wrap justify-between gap-12 md:mb-16 md:flex-nowrap lg:gap-36">
          <FooterMenus />
          <FooterNewsletterSub title="Subscribe to Newsletter" />
        </div>
        <div className="flex flex-col gap-5 md:flex-row">
          {isWSX ? (
            <Image
              className=" mx-auto block invert"
              src="/wsx/powered-ztg.svg"
              alt="Zeitgeist logo "
              width={247}
              height={106}
            />
          ) : (
            <span className="whitespace-nowrap text-center text-ztg-12-150 text-white md:text-start">
              © 2022 Equipoise Corp.
            </span>
          )}
          <span className="text-[11px] leading-relaxed text-sky-600">
            Please be advised that Equipoise Corp. d/b/a Zeitgeist is registered
            under the laws of Panama, and Zeitgeist has not sought licensing
            with any other regulatory authority of any country or jurisdiction,
            nor has any such regulatory authority passed upon or endorsed the
            merits of the financial products offered by Zeitgeist. Therefore,
            Zeitgeist does not accept clients from the United States and other
            similar jurisdictions where regulations prohibit Zeitgeist from
            offering its financial products (“Regulated Jurisdictions”). While
            this website may be accessed worldwide, the information provided is
            only intended for use by any person in any country where such use
            would not be contrary to local law or regulation. Browsers from
            Regulated Jurisdictions are specifically prohibited from using this
            site.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
