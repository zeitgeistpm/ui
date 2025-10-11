import React, { FC } from "react";
import axios from "axios";
import Link from "next/link";
import { useNotifications } from "lib/state/notifications";
import { useForm } from "react-hook-form";
import { endpointOptions } from "lib/constants";
import Input from "./Input";

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
      <h6 className="mb-[26px] font-semibold text-white">{title}</h6>
      <div className="mb-auto flex h-10 w-full items-center gap-3">
        <Input
          {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
          className={`h-full grow rounded-md border-[1px] bg-anti-flash-white p-2 text-ztg-12-120 text-gray-600 focus:outline-none ${
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
      <div className="flex flex-col text-ztg-14-150 text-gray-400">
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
  const footerLinks = [
    {
      text: "Apps",
      href: `https://polkadot.js.org/apps/?rpc=${endpointOptions[0].value}`,
      external: true,
    },
    { text: "Website", href: "https://zeitgeist.pm", external: true },
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
    <div className="mt-auto w-full bg-sky-950/95 py-4 shadow-lg backdrop-blur-md">
      <div className="container-fluid">
        {/* Main Footer Row */}
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row md:gap-6">
          {/* Copyright */}
          <span className="text-xs text-white/80">
            © {new Date().getFullYear()} Equipoise Corp.
          </span>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            {footerLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                className="text-white/70 transition-colors hover:text-sky-300"
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
