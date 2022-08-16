import Link from "next/link";
import ZeitgeistLogo from "./Logo";

interface FooterItem {
  title: string;
  link: string;
}

const generalItems: FooterItem[] = [
  {
    title: "Assets",
    link: "https://drive.google.com/drive/folders/1AfYT8k-LRK_84Ca76jgQktVQsSwkBYwW",
  },
  {
    title: "Blog",
    link: "https://blog.zeitgeist.pm/",
  },
  {
    title: "Careers",
    link: "https://angel.co/company/zeitgeist-pm",
  },
  {
    title: "Wallpapers",
    link: "https://mega.nz/folder/XzxjDaTJ#APLp7GIZ-JMUrgZJu6itvQ",
  },
];

const techItems: FooterItem[] = [
  {
    title: "GitHub",
    link: "https://github.com/ZeitgeistPM",
  },
  {
    title: "Privacy",
    link: "https://zeitgeist.pm/privacy.pdf",
  },
];

const communityItems: FooterItem[] = [
  {
    title: "Discord",
    link: "https://discord.com/invite/xv8HuA4s8v",
  },
  {
    title: "Telegram",
    link: "https://t.me/zeitgeist_official",
  },
  {
    title: "Twitter",
    link: "https://twitter.com/ZeitgeistPM",
  },
];

const FooterSection = ({
  title,
  items,
}: {
  title: string;
  items: FooterItem[];
}) => {
  return (
    <div className="flex flex-col">
      <div className="font-light text-3xl font-space">{title}</div>
      <div className="flex flex-col mt-4">
        {items.map((item) => (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-lato text-lg text-sky-600 hover:text-white"
            key={item.title}
          >
            {item.title}
          </a>
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer
      className="relative border-t border-[#45059E] mt-16 py-8"
      style={{ zIndex: 50 }}
    >
      <div className="flex w-full items-start justify-between flex-wrap">
        <div className="flex items-center mr-2 mb-6 text-opacity-70 text-white">
          <div className="opacity-70">
            <ZeitgeistLogo height={44} width={44} />
          </div>
          <div className="ml-3 font-kanit  font-bold text-2xl">Zeitgeist</div>
        </div>
        <div className="flex flex-1 flex-wrap justify-between w-full max-w-[750px] gap-4 mb-6">
          <FooterSection title="General" items={generalItems} />
          <FooterSection title="Technology" items={techItems} />
          <FooterSection title="Community" items={communityItems} />
        </div>
      </div>
      <div className="text-sky-600 font-lato">© 2022 Zeitgeist PM</div>
    </footer>
  );
};

export default Footer;
