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
import InfoPopover from "components/ui/InfoPopover";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { isCampaignAsset } from "lib/constants";

interface TableProps {
  data?: TableData[] | null;
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
  showHighlight?: boolean;
}

export interface TableColumn {
  header: string | ReactNode;
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
  className,
  onClick,
}: {
  type: ColumnType;
  rowHeight: number;
  value: string | number | CurrencyData;
  className?: string;
  onClick?: () => void;
}) => {
  const {
    data: ztgPrice,
    isLoading: ztgIsLoading,
    isLoadingError: ztgIsLoadingError,
  } = useZtgPrice();

  const base = `dark:text-white px-4 h-16 ${
    onClick ? "cursor-pointer" : ""
  } ${className}`;
  const style = { height: `${rowHeight}px` };
  const skeletonElement = (
    <td
      className={`text-xs font-semibold ${base} `}
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
          className={`text-xs md:text-sm ${base} `}
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
          className={`text-xs font-semibold ${base}`}
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
            <div className="flex-end h-full items-center">
              <TableChart data={value} />
            </div>
          </td>
        );
      }
    case "paragraph":
      return (
        <td
          className={`text-left text-xs font-semibold ${base}`}
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
            <div className="mb-0.5 text-sm">
              {formatNumberLocalized(value.value)}
            </div>
            {!isCampaignAsset && (
              <div className="text-xs font-light text-sky-600">
                $
                {(
                  value.usdValue ?? (ztgPrice?.toNumber() ?? 0) * value.value
                ).toFixed(2)}
              </div>
            )}
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
            <div className="ml-2.5 text-xs font-semibold">
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
              <div className="font-semibold uppercase" data-test="tokenText">
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
                className="mr-2.5 h-10 w-10 rounded-md"
                src={value.url}
                loading="lazy"
              />
              <span className="text-xxs font-semibold uppercase text-sky-600">
                {value.label}
              </span>
            </div>
          </td>
        );
      }
    case "percentage":
      return (
        <td className={`text-sm ${base}`} onClick={onClick} style={style}>
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
  showHighlight = true,
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

  const loadMoreThresholdIndex =
    loadMoreThreshold && data
      ? Math.floor((data.length / 100) * loadMoreThreshold)
      : false;

  useEffect(() => {
    if (loadMoreInView && loadMoreThresholdIndex) {
      onLoadMore?.();
    }
  }, [loadMoreRef, loadMoreInView, loadMoreThresholdIndex, data]);

  const getHeaderClass = (column: TableColumn) => {
    const base = "px-4 text-xxs sm:text-xs text-left font-medium";

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

  const renderColumns = columns.filter(
    (col) => columnIsCollapsed(col.accessor) == false,
  );

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
          <table
            className="w-full border-separate rounded-lg shadow-xl shadow-gray-100 "
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
              <tr className="h-12 bg-light-gray">
                {renderColumns.map((column, index) => (
                  <th
                    key={index}
                    className={`${getHeaderClass(column)} border-b-2 ${
                      index == 0 ? "rounded-tl-xl" : ""
                    } ${index == columns.length - 1 ? "rounded-tr-xl" : ""}
                    ${column.hideMobile ? "hidden sm:table-cell" : ""}
                    `}
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
                          className="ml-2 cursor-pointer"
                        />
                      ) : (
                        <></>
                      )}
                      {column.infobox && (
                        <InfoPopover
                          position={
                            index === 0
                              ? "bottom-end"
                              : index > renderColumns.length - 3
                                ? "bottom-start"
                                : "bottom"
                          }
                          title={
                            <h3 className="mb-4 flex items-center justify-center gap-2">
                              <AiOutlineInfoCircle />
                              {column.header}
                            </h3>
                          }
                          children={column.infobox}
                        />
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
                    ref={index === loadMoreThresholdIndex ? loadMoreRef : null}
                    key={row.id}
                    className={`
                      group
                      border-t-1 border-gray-200
                      transition-colors duration-100 ease-in-out
                      ${
                        showHighlight === true
                          ? " hover:border-blue-300 hover:bg-blue-lighter "
                          : ""
                      }
                    ${rowColorClass}
                    ${onRowClick ? "cursor-pointer" : ""} mx-1
                    
                    `}
                    onClick={() => handleRowClick(row)}
                  >
                    {row.cells
                      .filter(
                        (cell) => columnIsCollapsed(cell.column.id) == false,
                      )
                      .map((cell, index) => {
                        const col = renderColumns[index];
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
                            className={`${
                              col.hideMobile ? "hidden sm:table-cell" : ""
                            }`}
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
                <Skeleton key={index} height={80} className="mb-4" />
              ))}
          </div>

          {!loadingMore && rows.length === 0 ? (
            <div className="flex w-full justify-center">
              <div className="my-8 font-bold">{noDataMessage}</div>
            </div>
          ) : (
            <></>
          )}

          {onPaginate ? <Paginator onPlusClicked={handlePlusClicked} /> : <></>}

          {onLoadMore && !hideLoadMore && (
            <div className="mb-5 mt-4 flex justify-center">
              <div
                className="text-xs font-bold uppercase text-sky-600"
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
