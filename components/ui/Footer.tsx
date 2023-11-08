import React, { FC } from "react";
import axios from "axios";
import Link from "next/link";
import { useNotifications } from "lib/state/notifications";
import { useForm } from "react-hook-form";
import { endpointOptions, isWSX } from "lib/constants";
import Input from "./Input";
import Image from "next/image";

const FooterNewsletterSub: FC<{ title: string }> = ({ title }) => {
  const notificationStore = useNotifications();
  const { register, formState, handleSubmit, reset } = useForm();

  const invalid = formState.isValid === false && formState.isDirty;

  const subscribe = async ({ email }: { email: string }) => {
    try {
      await axios.post("https://emails.zeitgeist.pm/app-subscribe", { email });

      notificationStore.pushNotification(
        "Email sent successfully! We'll be in touch soon.",
        { type: "Success" },
      );

      reset();
    } catch {
      notificationStore.pushNotification(
        "Something went wrong, please try again.",
        { type: "Error" },
      );
    }
  };

  return (
    <form className="flex flex-col w-full" onSubmit={handleSubmit(subscribe)}>
      <h6 className="font-semibold text-white mb-[26px]">{title}</h6>
      <div className="flex gap-3 items-center h-10 mb-auto w-full">
        <Input
          {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
          className={`h-full grow rounded-md text-sky-600 p-2 text-ztg-12-120 bg-anti-flash-white border-[1px] focus:outline-none ${
            invalid ? "border-vermilion" : "border-none"
          }`}
          type="email"
        />
        <button
          type="submit"
          className={`h-full flex-shrink text-ztg-16-150 rounded-full center bg-ztg-blue text-white px-5 ${
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
      <h6 className="font-semibold mb-1 text-white">{title}</h6>
      <div className="text-ztg-14-150 flex flex-col text-sky-600">
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

const Footer = () => {
  return (
    <div className="w-full mt-auto flex flex-col pb-24 pt-12 bg-[#1C1C1C]">
      <div className="container-fluid">
        <div className="flex justify-between gap-12 lg:gap-36 mb-8 md:mb-16 flex-wrap md:flex-nowrap">
          <div className="flex justify-between gap-7 w-full">
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
          <FooterNewsletterSub title="Subscribe to Newsletter" />
        </div>
        <div className="flex flex-col md:flex-row gap-5">
          <span className="text-center md:text-start whitespace-nowrap text-ztg-12-150 text-white">
            {isWSX && (
              <Image
                className=""
                src="/wsx/wsx-logo-header.svg"
                alt="Washington Stock Exchange logo"
                width={247}
                height={106}
              />
            )}
            © 2022 Equipoise Corp.
          </span>
          <span className="text-sky-600 text-[11px] leading-relaxed">
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
