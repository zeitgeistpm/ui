import React, { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";

const MarketSearch: FC = observer(() => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>();

  const router = useRouter();

  const searchMarkets = (searchText: string) => {
    router.push({ pathname: "/markets", query: { searchText } });
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="hidden md:flex rounded items-center justify-between w-full bg-anti-flash-white max-w-[520px] h-full px-4 mx-4"
      onClick={() => focusInput()}
    >
      <div className="flex items-center text-sky-600">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchMarkets(text);
          }}
          className="w-full"
        >
          <input
            type="text"
            placeholder="Search markets"
            value={text}
            ref={inputRef}
            onChange={(e) => setText(e.target.value)}
            className="bg-transparent focus:outline-none w-full"
          />
        </form>
      </div>
    </div>
  );
});

export default MarketSearch;
