// const { mutate } = useCreatePost();
import { useState } from "react";
import { Plus } from "reicon-react";

import { useAuth } from "@/auth/AuthContext";

const CreatePost = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasSession, user } = useAuth();
  if (!isOpen) {
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
        <div className="card modal-box max-h-[calc(100dvh-32px)] min-h-[330px] w-full max-w-[600px] overflow-y-auto rounded-[30px] border-[3px] border-primary bg-primary-content p-0 text-base-100 shadow-2xl max-[500px]:min-h-[250px] max-[500px]:rounded-[22px] max-[500px]:border-2">
          <div
            id="createPostHead"
            className="flex shrink-0 items-center gap-4 border-b border-[#5AA9E6] bg-primary px-6 py-4 max-[500px]:px-4 max-[500px]:py-3"
          >
            <h2
              id="displayName"
              className="card-title block min-w-0 flex-1 text-[40px] leading-tight font-black [overflow-wrap:anywhere] max-[500px]:text-[28px]"
            >
              {user.displayName}
            </h2>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Beitrag schließen"
              className="btn btn-circle shrink-0 btn-ghost text-base-100 hover:bg-white/20"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                ×
              </span>
            </button>
          </div>

          <div
            id="createPostBody"
            className="flex-1 px-8 pt-3 pb-6 max-[500px]:px-4 max-[500px]:pt-2 max-[500px]:pb-4"
          >
            {/* Hier euer Formular einsetzen */}
          </div>
        </div>
      </dialog>
    );
  }
};

export default CreatePost;
