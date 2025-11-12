import React, { FC } from "react";
import axios from "axios";
import Link from "next/link";
import { useNotifications } from "lib/state/notifications";
import { useForm } from "react-hook-form";
import { endpointOptions } from "lib/constants";
import Input from "./Input";
import Logo from "../icons/ZeitgeistIcon";

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
    <form className="flex w-full flex-col" onSubmit={handleSubmit(subscribe)}>
      <h6 className="mb-[26px] flex items-center gap-2 font-semibold text-white">
        <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
        {title}
      </h6>
      <div className="mb-auto flex h-10 w-full items-center gap-3">
        <Input
          {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
          className={`h-full grow rounded-md bg-white/10 p-2 text-ztg-12-120 text-white/90 backdrop-blur-sm placeholder:text-white/60 focus:bg-white/15 focus:outline-none ${
            invalid ? "border-r-2ed-500/60" : ""
          }`}
          type="email"
        />
        <button
          type="submit"
          className={`center h-full flex-shrink rounded-full bg-ztg-green-600/80 px-5 text-ztg-16-150 text-white backdrop-blur-sm transition-all hover:bg-ztg-green-600 ${
            invalid ? "cursor-default opacity-60" : "cursor-pointer"
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
      <h6 className="mb-3 flex items-center gap-2 font-semibold text-white">
        <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
        {title}
      </h6>
      <div className="flex flex-col text-ztg-14-150 text-white/70">
        {links.map(({ text, href }, idx) => {
          return (
            <Link
              href={href}
              key={`footerMenuLink${idx}`}
              target="_blank"
              className="mb-0.5 transition-colors hover:text-ztg-green-500"
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
  const footerLinks = [
    {
      text: "Block Explorer",
      href: `https://polkadot.js.org/apps/?rpc=${endpointOptions[0].value}`,
      external: true,
    },
    { text: "Docs", href: "https://docs.zeitgeist.pm", external: true },
    { text: "Github", href: "https://github.com/zeitgeistpm", external: true },
    { text: "Discord", href: "https://discord.gg/xv8HuA4s8v", external: true },
    {
      text: "Twitter",
      href: "https://twitter.com/ZeitgeistPM",
      external: true,
    },
    { text: "Terms", href: "/terms", external: false },
  ];

  return (
    <div className="mt-auto w-full border-t-2 border-white/10 bg-ztg-primary-500 py-4 shadow-lg backdrop-blur-md">
      <div className="container-fluid">
        {/* Main Footer Row */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Powered by */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">Powered by</span>
            <Link
              href="/"
              className="group flex cursor-pointer items-center gap-1.5 transition-colors"
            >
              <div className="scale-75 [&_svg_path]:transition-colors group-hover:[&_svg_path]:fill-ztg-green-500">
                <Logo variant={"light"} width={20} height={20} />
              </div>
              <span className="text-xs font-semibold text-white/90 transition-colors group-hover:text-ztg-green-500">
                Zeitgeist
              </span>
            </Link>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            {footerLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-white/70 transition-colors hover:text-ztg-green-500 hover:underline"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
