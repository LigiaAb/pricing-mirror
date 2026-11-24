import { useEffect } from "react";

const useAutoReload = () => {
  useEffect(() => {
    fetch("/meta.json") // Un archivo que cambia en cada build
      .then((res) => res.json())
      .then((data) => {
        const lastVersion = localStorage.getItem("app_version");
        if (lastVersion && lastVersion !== data.version) {
          window.location.reload(true);
        }
        localStorage.setItem("app_version", data.version);
      });
  }, []);
};

export default useAutoReload;
