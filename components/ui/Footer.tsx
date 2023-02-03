import React, { FC } from "react";
import axios from "axios";
import MobxReactForm from "mobx-react-form";
import { ChevronRight } from "react-feather";
import { observer } from "mobx-react";
import Link from "next/link";

import { useNotificationStore } from "lib/stores/NotificationStore";
import { defaultOptions, defaultPlugins } from "lib/form";

const newsletterSubForm = new MobxReactForm(
  {
    fields: {
      email: {
        value: "",
        rules: "required|email",
      },
    },
  },
  {
    plugins: defaultPlugins,
    options: defaultOptions,
  },
);

const FooterNewsletterSub: FC<{ title: string }> = observer(({ title }) => {
  const notificationStore = useNotificationStore();
  const formField = newsletterSubForm.$("email");

  const invalid = formField.showError && !formField.isValid;

  const subscribe = async (email: string) => {
    try {
      await axios.post("https://emails.zeitgeist.pm/app-subscribe", { email });

      notificationStore.pushNotification(
        "Email sent successfully! We'll be in touch soon.",
        { type: "Success" },
      );
    } catch {
      notificationStore.pushNotification(
        "Something went wrong, please try again.",
        { type: "Error" },
      );
    }
  };

  return (
    <form
      className="flex flex-col w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (invalid) {
          return;
        }
        subscribe(formField.value);
      }}
    >
      <h3 className="text-center md:text-start text-ztg-16-150 font-bold mb-ztg-30">
        {title}
      </h3>
      <div className="flex gap-3 items-center h-ztg-40 mb-auto w-full">
        <input
          value={newsletterSubForm.$("email").value}
          onChange={newsletterSubForm.$("email").onChange}
          className={`h-full grow rounded text-sky-600 p-2 text-ztg-12-120 bg-anti-flash-white focus:outline-none ${
            invalid ? "border-vermilion" : "border-none"
          }`}
        />
        <button
          type="submit"
          className={`h-full w-ztg-40 flex-shrink-0 rounded-full center bg-pastel-blue text-white ${
            invalid ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </form>
  );
});

interface FooterMenuProps {
  title: string;
  links: { text: string; href: string }[];
  className?: string;
}

const FooterMenu: FC<FooterMenuProps> = observer(
  ({ title, links, className = "" }) => {
    return (
      <div
        className={` ${className}
          `}
      >
        <h3 className="font-bold">{title}</h3>
        <div className="text-ztg-14-150 flex flex-col text-sky-600">
          {links.map(({ text, href }, idx) => {
            return (
              <Link href={href} key={`footerMenuLink${idx}`} target="_blank">
                <span>{text}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  },
);

const Footer = observer(() => {
  return (
    <div className="mx-auto max-w-screen-2xl flex flex-col pb-28">
      <div className="flex justify-between gap-10 mb-8 md:mb-16">
        <FooterNewsletterSub title="Subscribe to Newsletter" />
        <div className="hidden md:flex justify-between gap-5 w-full ">
          <FooterMenu
            title="General"
            links={[
              { text: "Website", href: "https://zeitgeist.pm" },
              { text: "Blog", href: "https://blog.zeitgeist.pm" },
              {
                text: "Privacy Policy",
                href: "https://docs.google.com/document/d/e/2PACX-1vSzOpsuAJ3CKHNeitx4um2k-D9m7dJzJ0ZyXe0buWQXm_MWUoaNujCYwnvp4P8Ia70-59JxDraWUebT/pub",
              },
              {
                text: "Terms of Use",
                href: "https://docs.google.com/document/d/e/2PACX-1vQuMdjqEVt7lPwnGimAQd9lJufSwCJ6S_kSJlL_wYLTOlJnIDcnzOaunXRVpOHIrw/pub",
              },
            ]}
          />
          <FooterMenu
            title="Technology"
            links={[
              { text: "Documentation", href: "https://docs.zeitgeist.pm" },
              { text: "Github", href: "https://github.com/zeitgeistpm" },
              {
                text: "Polkadot-JS Apps",
                href: "https://polkadot.js.org/apps/?rpc=wss://bsr.zeitgeist.pm",
              },
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
      </div>
      <div className="flex flex-col md:flex-row gap-5">
        <span className="text-center md:text-start font-bold whitespace-nowrap text-ztg-12-150">
          © 2022 Equipoise Corp.
        </span>
        <span className="text-sky-600 text-[11px] leading-relaxed">
          Please be advised that Equipoise Corp. d/b/a Zeitgeist is registered
          under the laws of Panama, and Zeitgeist has not sought licensing with
          any other regulatory authority of any country or jurisdiction, nor has
          any such regulatory authority passed upon or endorsed the merits of
          the financial products offered by Zeitgeist. Therefore, Zeitgeist does
          not accept clients from the United States and other similar
          jurisdictions where regulations prohibit Zeitgeist from offering its
          financial products (“Regulated Jurisdictions”). While this website may
          be accessed worldwide, the information provided is only intended for
          use by any person in any country where such use would not be contrary
          to local law or regulation. Browsers from Regulated Jurisdictions are
          specifically prohibited from using this site.
        </span>
      </div>
    </div>
  );
});

export default Footer;
