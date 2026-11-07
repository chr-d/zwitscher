// const { mutate } = useCreatePost();
import { useState } from "react";
import { Plus, X } from "reicon-react";

import { useAuth } from "@/auth/AuthContext";

const CreatePost = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasSession, user } = useAuth();

  if (!isOpen && hasSession) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Create new Post"
        className="btn fixed right-6 bottom-6 bottom-24 z-40 btn-circle h-16 w-16 border-0 bg-base-300 text-white shadow-xl transition-all duration-200 hover:bg-[#438DD1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#579FE4] active:scale-95 motion-safe:hover:-translate-y-1 min-[501px]:bottom-6"
      >
        <Plus weight="Filled" color="var(color--base-300)" />
      </button>
    );
  }
  if (hasSession === true && user !== null && isOpen) {
    return (
      <dialog
        ref={(dialog) => {
          if (dialog && !dialog.open) {
            dialog.showModal();
          }
        }}
        onClose={() => setIsOpen(false)}
        aria-labelledby="displayName"
        className="modal p-4 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="card modal-box max-h-[calc(100dvh-32px)] min-h-[330px] w-full max-w-[600px] overflow-hidden rounded-[6px] bg-primary-content p-0 text-base-100 shadow-none transition-transform duration-200 motion-safe:hover:-translate-y-0.5 max-[500px]:min-h-[250px]">
          <div
            id="createPostHead"
            className="flex shrink-0 items-center gap-4 border-b border-[#5AA9E6] bg-linear-to-r from-primary to-secondary px-6 py-3 max-[500px]:px-4 max-[500px]:py-2"
          >
            <h2
              id="displayName"
              className="card-title block min-w-0 flex-1 text-[24px] leading-tight font-black [overflow-wrap:anywhere] text-primary-content max-[500px]:text-[24px]"
            >
              {user.displayName}
            </h2>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Beitrag schließen"
              className="shrink-0 btn-ghost text-primary-content transition-colors hover:bg-transparent hover:text-red-500"
            >
              <X />
            </button>
          </div>

          <div
            id="createPostBody"
            className="flex-1 px-8 pt-3 pb-6 max-[500px]:px-4 max-[500px]:pt-2 max-[500px]:pb-4"
          >
            <form action=""></form>
          </div>
          <button className="btn m-4 mx-auto w-16 rounded-[6px] border-0 bg-secondary px-6 font-bold text-primary-content transition duration-200 hover:brightness-110">
            Submit
          </button>
        </div>
      </dialog>
    );
  }
};

export default CreatePost;
