import Skeleton from "components/ui/Skeleton";
import TableChart from "components/ui/TableChart";
import { useEvent } from "lib/hooks";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { formatNumberLocalized } from "lib/util";
import { range } from "lodash";
import { useInView } from "react-intersection-observer";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ArrowDown } from "react-feather";
import { useTable } from "react-table";
import Avatar from "./Avatar";
import Paginator from "./Paginator";
import PercentageChange from "./PercentageChange";
import { ChartData } from "./TimeSeriesChart";
import { InfoPopover } from "components/ui/InfoPopover";

interface TableProps {
  data: TableData[];
  columns: TableColumn[];
  rowColorClass?: string;
  rowHeightPx?: number;
  onRowClick?: (row: TableData) => void;
  onPaginate?: (pageIndex: number) => void;
  onLoadMore?: () => void;
  hideLoadMore?: boolean;
  noDataMessage?: string | ReactNode;
  loadingMore?: boolean;
  loadingNumber?: number;
  loadMoreThreshold?: number;
  testId?: string;
}

export interface TableColumn {
  header: string;
  type: ColumnType;
  accessor: string;
  width?: string;
  onSort?: () => void;
  initialSort?: "asc" | "desc";
  onClick?: (row: TableData) => void;
  alignment?: string;
  infobox?: string;
  // if specified the table will hide this column if it is overflowing
  // lower number columns will be hidden first
  collapseOrder?: number;
  hideMobile?: boolean;
}

export interface TableData {
  [key: string]: CellValue;
}

type CellValue =
  | string
  | number
  | CurrencyData
  | TokenData
  | MarketData
  | ChartData[]
  | ReactNode
  | Amount;

type ColumnType =
  | "text"
  | "paragraph"
  | "number"
  | "currency"
  | "token"
  | "percentage"
  | "change"
  | "address"
  | "graph"
  | "market"
  | "component";

interface CurrencyData {
  value: number;
  usdValue?: number;
}

interface TokenData {
  token: true;
  label: string;
}

interface MarketData {
  label: string;
  url: string;
}

interface Amount {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

const isCurrencyData = (cellValue: CellValue): cellValue is CurrencyData => {
  return (cellValue as CurrencyData).value !== undefined;
};

const isTokenData = (cellValue: CellValue): cellValue is TokenData => {
  return (cellValue as TokenData).token !== undefined;
};

const isMarketData = (cellValue: CellValue): cellValue is MarketData => {
  return (cellValue as MarketData).url !== undefined;
};

const Cell = ({
  type,
  value,
  rowHeight,
  onClick,
}: {
  type: ColumnType;
  rowHeight: number;
  value: string | number | CurrencyData;
  onClick?: () => void;
}) => {
  const {
    data: ztgPrice,
    isLoading: ztgIsLoading,
    isLoadingError: ztgIsLoadingError,
  } = useZtgPrice();

  const base = `dark:text-white px-ztg-15 h-ztg-72 ${
    onClick ? "cursor-pointer" : ""
  }`;
  const style = { height: `${rowHeight}px` };
  const skeletonElement = (
    <td
      className={`font-semibold text-ztg-12-150 ${base}`}
      onClick={onClick}
      style={style}
    >
      <div className="">
        <Skeleton width={25} height={25} />
      </div>
    </td>
  );

  if (value == null) {
    return skeletonElement;
  }

  switch (type) {
    case "text":
      return (
        <td
          className={`text-ztg-14-150 ${base}`}
          data-test="outcomeText"
          onClick={onClick}
          style={style}
        >
          <>{value}</>
        </td>
      );
    case "number":
      return (
        <td
          className={`font-semibold text-ztg-12-150 ${base}`}
          onClick={onClick}
          style={style}
        >
          {formatNumberLocalized(Number(value))}
        </td>
      );
    case "change":
      return (
        <td className={`${base}`} onClick={onClick} style={style}>
          <div className="">
            <PercentageChange change={value.toString()} />
          </div>
        </td>
      );
    case "component":
      return (
        <td className={`${base}`} onClick={onClick} style={style}>
          <>{value}</>
        </td>
      );
    case "graph":
      if (Array.isArray(value)) {
        return (
          <td className={`${base}`} onClick={onClick} style={style}>
            <div className="flex-end items-center h-full">
              <TableChart data={value} />
            </div>
          </td>
        );
      }
    case "paragraph":
      return (
        <td
          className={` font-semibold text-ztg-12-150 text-left ${base}`}
          onClick={onClick}
          style={style}
        >
          <>{value}</>
        </td>
      );
    case "currency":
      if (
        isCurrencyData(value) &&
        ztgIsLoading === false &&
        ztgIsLoadingError === false
      ) {
        return (
          <td className={`${base} `} onClick={onClick} style={style}>
            <div className="text-ztg-14-150 font-mediun mb-[2px]">
              {formatNumberLocalized(value.value)}
            </div>
            <div className="text-ztg-12-150 font-light text-sky-600">
              $
              {((value.usdValue ?? ztgPrice?.toNumber()) * value.value).toFixed(
                2,
              )}
            </div>
          </td>
        );
      } else {
        return skeletonElement;
      }
    case "address":
      return (
        <td className={` ${base}`} onClick={onClick} style={style}>
          <div className="flex items-center">
            <Avatar address={typeof value === "string" ? value : ""} />
            <div className="font-semibold text-ztg-12-150 ml-ztg-10">
              {typeof value === "string" ? value : ""}
            </div>
          </div>
        </td>
      );
    case "token":
      if (isTokenData(value)) {
        return (
          <td className={` ${base}`} onClick={onClick} style={style}>
            <div className="flex items-center">
              <div
                className="font-semibold text-ztg-16-150 uppercase"
                data-test="tokenText"
              >
                {value.label}
              </div>
            </div>
          </td>
        );
      }
    case "market":
      if (isMarketData(value)) {
        return (
          <td className={` ${base}`} onClick={onClick} style={style}>
            <div className="flex items-center">
              <img
                className="rounded-ztg-5 w-ztg-40 h-ztg-40 mr-ztg-10"
                src={value.url}
                loading="lazy"
              />
              <span className="font-semibold text-ztg-10-150 text-sky-600 uppercase">
                {value.label}
              </span>
            </div>
          </td>
        );
      }
    case "percentage":
      return (
        <td
          className={`text-ztg-14-150 ${base}`}
          onClick={onClick}
          style={style}
        >
          <>{value}</>%
        </td>
      );
    default:
      return <td>default</td>;
  }
};

const Table = ({
  data,
  columns,
  onRowClick,
  onPaginate,
  onLoadMore,
  rowColorClass,
  rowHeightPx = 72,
  hideLoadMore = false,
  noDataMessage = "No data found",
  loadingMore = false,
  loadingNumber = 3,
  loadMoreThreshold,
  testId,
}: TableProps) => {
  const { rows, prepareRow } = useTable({ columns, data: data ?? [] });
  const tableRef = useRef<HTMLTableElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>();
  const windowResizeEvent = useEvent(
    typeof window !== "undefined" ? window : undefined,
    "resize",
    50,
  );
  const [collapsedAccessors, setCollapsedAccessors] = useState<Set<string>>(
    new Set(),
  );

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView();

  const loadMoreThresholdIndex = loadMoreThreshold
    ? Math.floor((data.length / 100) * loadMoreThreshold)
    : false;

  useEffect(() => {
    if (loadMoreInView && loadMoreThresholdIndex) {
      onLoadMore?.();
    }
  }, [loadMoreRef, loadMoreInView, loadMoreThresholdIndex, data]);

  const getHeaderClass = (column: TableColumn) => {
    const base =
      "px-ztg-15 text-sky-600 font-semibold text-ztg-12-150 text-left";

    if (column.alignment) {
      return `${column.alignment} ${base}`;
    }

    return base;
  };

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  const handlePlusClicked = () => {};

  const handleSortClick = () => {};

  const handleLoadMore = () => {
    onLoadMore && onLoadMore();
  };

  useEffect(() => {
    calcOverflow();
  }, [windowResizeEvent, rows]);

  const calcOverflow = () => {
    if (tableRef?.current) {
      const { clientWidth, scrollWidth, parentElement } = tableRef.current;
      if (!parentElement) return;
      const isOverflowing =
        scrollWidth > parentElement.scrollWidth ||
        clientWidth > parentElement.clientWidth;

      //if table is overflowing check if we can collaspe any columns
      if (isOverflowing) {
        const collapseNext = columns
          .filter((col) => col.collapseOrder != null)
          .sort((a, b) =>
            a.collapseOrder && b.collapseOrder
              ? a.collapseOrder - b.collapseOrder
              : -1,
          )
          .map((col) => col.accessor)
          .filter((accessor) => !collapsedAccessors.has(accessor))[0];

        if (collapseNext) {
          setCollapsedAccessors((accessors) => accessors.add(collapseNext));
        } else {
          setIsOverflowing(true);
        }
      } else {
        setIsOverflowing(false);
      }
    } else {
      setIsOverflowing(false);
    }
  };

  const columnIsCollapsed = (columnAccessor: string) =>
    collapsedAccessors.has(columnAccessor);
  return (
    <>
      {data == null ? (
        <div>
          {range(0, loadingNumber).map((index) => (
            <Skeleton key={index} height={72} className="mb-2" />
          ))}
        </div>
      ) : (
        <>
          <div data-testid={testId}>
            <table
              className="border-separate w-full"
              ref={tableRef}
              style={
                isOverflowing === true
                  ? {
                      display: "block",
                      whiteSpace: "nowrap",
                      overflowX: "auto",
                    }
                  : {}
              }
            >
              <thead>
                <tr className="bg-gray-100 h-[50px]">
                  {columns
                    .filter((col) => columnIsCollapsed(col.accessor) == false)
                    .map((column, index) => (
                      <th
                        key={index}
                        className={`${getHeaderClass(column)} ${
                          index == 0 ? "rounded-tl-md" : ""
                        } ${
                          index == columns.length - 1 ? "rounded-tr-md" : ""
                        }`}
                        style={column.width ? { width: column.width } : {}}
                      >
                        <div
                          className={`${
                            column.onSort
                              ? "flex justify-center"
                              : column.infobox
                              ? "flex items-center gap-1"
                              : ""
                          }`}
                        >
                          {column.header}
                          {column.onSort ? (
                            <ArrowDown
                              role="button"
                              onClick={handleSortClick}
                              size={14}
                              className="ml-ztg-8 cursor-pointer"
                            />
                          ) : (
                            <></>
                          )}
                          {column.infobox && (
                            <InfoPopover children={column.infobox} />
                          )}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  prepareRow(row);

                  return (
                    <tr
                      ref={
                        index === loadMoreThresholdIndex ? loadMoreRef : null
                      }
                      key={row.id}
                      className={`
                    ${rowColorClass}
                    ${onRowClick ? "cursor-pointer" : ""} mx-ztg-5`}
                      onClick={() => handleRowClick(row)}
                    >
                      {row.cells
                        .filter(
                          (cell) => columnIsCollapsed(cell.column.id) == false,
                        )
                        .map((cell, index) => {
                          return (
                            <Cell
                              key={`${row.id}-${index}`}
                              type={cell.column.type}
                              value={cell.value}
                              rowHeight={rowHeightPx}
                              onClick={
                                cell.column.onClick &&
                                cell.column.onClick(row.original)
                              }
                            />
                          );
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="">
              {loadingMore &&
                range(0, loadingNumber).map((index) => (
                  <Skeleton key={index} height={80} className="mb-ztg-16" />
                ))}
            </div>

            {!loadingMore && rows.length === 0 ? (
              <div className="w-full flex justify-center">
                <div className="text-ztg-16-120 font-bold mt-ztg-60">
                  {noDataMessage}
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>

          {onPaginate ? <Paginator onPlusClicked={handlePlusClicked} /> : <></>}

          {onLoadMore && !hideLoadMore && (
            <div className="flex justify-center mt-ztg-16 mb-ztg-20">
              <div
                className="uppercase  text-sky-600 font-bold text-ztg-10-150"
                role="button"
                onClick={handleLoadMore}
              >
                Load More
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Table;
