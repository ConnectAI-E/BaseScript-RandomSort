import {
  IGridViewProperty,
  IRecordValues,
  IWidgetTable,
  ViewType,
  bitable,
} from "@base-open/web-api";
import { Button } from "@douyinfe/semi-ui";
import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { Spin } from "@douyinfe/semi-ui";

async function go() {
  const selection = await bitable.base.getSelection();
  if (!selection.tableId) {
    return;
  }
  
  const table = await bitable.base.getTableById(selection.tableId);
  if (!selection.viewId) {
    return;
  }
  
  const view = await table.getViewById(selection.viewId);
  
  const type = await view.getType();
  if (type !== ViewType.Grid) {
    return;
  }

  const list = await view.getVisibleRecordIdList();
  
  const recordIdList: string[] = [];
  for (let id of list) {
    if (!id) {
      return;
    }
    recordIdList.push(id);
  }

  const recordList: IRecordValues[] = [];

  await Promise.all(
    recordIdList.map((id, index) => {
      return table.getRecordById(id).then((data) => {
        recordList[index] = data;
      });
    })
  );

  const len = recordList.length;
  for (let i = 0; i < len; i++) {
    const r = parseInt("" + Math.random() * len);
    const t = recordList[i];
    recordList[i] = recordList[r];
    recordList[r] = t;
  }

  await Promise.all(
    recordList.map((record, i) => {
      return table.setRecord(recordIdList[i], record);
    })
  );
}

async function getActiveTableAndView() {
  const selection = await bitable.base.getSelection();
  if (!selection.tableId) {
    return null;
  }
  const table: IWidgetTable = await bitable.base.getTableById(
    selection.tableId
  );
  if (!selection.viewId) {
    return null;
  }
  const view = await table.getViewById(selection.viewId);
  const type = await view.getType();
  if (type !== ViewType.Grid) {
    return null;
  }
  return { table, view };
}

export function App() {
  const [inited, setInited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [enable, setEnable] = useState<boolean | null>(false);
  const [activeTableInfo, setActiveTable] = useState<{
    tableName: string;
    viewName: string;
  } | null>(null);

  const updateActive = useCallback(() => {
    setInited(false);
    getActiveTableAndView().then((res) => {
      if (res !== null) {
        const tableInfo: { tableName: string; viewName: string } = {
          tableName: "",
          viewName: "",
        };
        Promise.all([
          res.table.getName().then((name) => {
            tableInfo.tableName = name;
          }),
          res.view.getName().then((name) => {
            tableInfo.viewName = name;
          }),
        ]).then(() => {
          setActiveTable(tableInfo);
          setEnable(true);
          setInited(true);
        });
      } else {
        setEnable(false);
        setInited(true);
      }
    });
  }, []);

  useEffect(updateActive, []);

  useEffect(() => {
    const unsub = bitable.base.onSelectionChange(() => {
      updateActive();
    });
    return unsub;
  }, [updateActive]);

  const text = enable ? (loading ? "打乱中..." : "打乱顺序") : "";

  const disabled = !enable || loading;

  const tips = inited ? (
    enable ? (
      <span>
        点击下方按钮即会
        <br />将
        <span style={{ fontWeight: "700" }}>
          {" "}
          {activeTableInfo?.tableName}{" "}
        </span>
        中
        <span style={{ fontWeight: "700" }}> {activeTableInfo?.viewName} </span>
        的<br />
        记录顺序打乱
      </span>
    ) : (
      "请打开一张数据表的表格视图"
    )
  ) : (
    <Spin size="large" />
  );

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span
        style={{
          marginBottom: "20px",
          padding: "10px",
          textAlign: "center",
        }}
      >
        {tips}
      </span>
      {inited && enable && (
        <Button
          onClick={async () => {
            setLoading(true);
            await go();
            setLoading(false);
          }}
          disabled={disabled}
        >
          {text}
        </Button>
      )}
    </div>
  );
}
