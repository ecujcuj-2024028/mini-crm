<script setup>
import { ref, watch, computed } from 'vue';
import { useCommentStore } from '../../stores/comment.store';
import { useAuthStore } from '../../stores/auth.store';
import AppModal from '../common/AppModal.vue';
import AppBadge from '../common/AppBadge.vue';
import AppButton from '../common/AppButton.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const commentStore = useCommentStore();
const authStore = useAuthStore();

const newCommentText = ref('');
const sendingComment = ref(false);

watch(
  () => [props.show, props.task],
  async ([isShown, currentTask]) => {
    if (isShown && currentTask?.id) {
      newCommentText.value = '';
      await commentStore.fetchComments(currentTask.id);
    } else {
      commentStore.unsubscribeComments();
    }
  },
  { immediate: true }
);

const handleAddComment = async () => {
  if (!newCommentText.value.trim() || !props.task?.id) return;
  sendingComment.value = true;
  try {
    await commentStore.createComment(props.task.id, newCommentText.value.trim());
    newCommentText.value = '';
  } catch (err) {
    console.error('Error al agregar comentario:', err);
  } finally {
    sendingComment.value = false;
  }
};

const handleDeleteComment = async (commentId) => {
  try {
    await commentStore.deleteComment(commentId);
  } catch (err) {
    console.error('Error al borrar comentario:', err);
  }
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const formattedTime = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(Number(dateVal) || dateVal);
  if (isNaN(d.getTime())) return dateVal;
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// Verificar si un comentario es automatico del sistema
const isSystemComment = (content) => {
  return typeof content === 'string' && content.startsWith('[SISTEMA]');
};

// Limpiar prefijo [SISTEMA] para la vista
const cleanSystemText = (content) => {
  if (!content) return '';
  return content.replace('[SISTEMA]', '').trim();
};
</script>

<template>
  <AppModal
    :show="show"
    :title="task?.title || 'Detalles de la Tarea'"
    maxWidth="max-w-2xl"
    @close="$emit('close')"
  >
    <div v-if="task" class="space-y-6">
      <!-- Datos Principales de la Tarea -->
      <div class="p-4 rounded-2xl bg-[#F3F6F7] border border-[#E4EAED] space-y-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-[#5C7E8F] uppercase bg-white px-2.5 py-1 rounded-lg border border-[#E4EAED]">
              {{ task.project?.name || 'Proyecto' }}
            </span>
            <AppBadge :variant="task.status">
              {{ task.status }}
            </AppBadge>
          </div>
          <span class="text-xs font-semibold text-[#4A4A4A]">
            Prioridad: <strong class="text-[#263840]">{{ task.priority }}</strong>
          </span>
        </div>

        <p v-if="task.description" class="text-xs text-[#4A4A4A] leading-relaxed">
          {{ task.description }}
        </p>

        <div class="text-[11px] text-[#6E6E6E] pt-2 border-t border-[#E4EAED]">
          Asignado a: <strong class="text-[#263840]">{{ task.assignedTo?.name || 'Sin asignar' }}</strong>
        </div>
      </div>

      <!-- Seccion Chat / Comentarios e Historial del Sistema -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-bold text-[#263840] uppercase tracking-wider flex items-center space-x-2">
            <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Historial & Comentarios</span>
          </h4>
        </div>

        <!-- Formulario Enviar Comentario -->
        <form @submit.prevent="handleAddComment" class="mb-4 space-y-2">
          <div class="relative">
            <textarea
              v-model="newCommentText"
              rows="2"
              placeholder="Escribe un comentario..."
              class="w-full pl-4 pr-12 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
            ></textarea>
            <AppButton
              type="submit"
              variant="primary"
              :loading="sendingComment"
              class="absolute right-2 bottom-2 py-1.5 px-3 text-xs"
            >
              Enviar
            </AppButton>
          </div>
        </form>

        <!-- Lista de Comentarios y Registros de Auditoria del Sistema -->
        <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
          <div v-if="commentStore.loading && commentStore.comments.length === 0" class="text-center py-4 text-xs text-[#6E6E6E]">
            Cargando historial de la tarea...
          </div>
          <div v-else-if="commentStore.comments.length === 0" class="text-center py-6 text-xs text-[#6E6E6E] bg-[#F3F6F7] rounded-xl border border-dashed border-[#C7C7C7]">
            Aún no hay comentarios o cambios de estado en esta tarea.
          </div>
          <div
            v-else
            v-for="comment in commentStore.comments"
            :key="comment.id"
            :class="[
              'p-3 rounded-xl border shadow-2xs flex items-start space-x-3 transition-colors',
              isSystemComment(comment.content) ? 'bg-sky-50/70 border-sky-200' : 'bg-white border-[#E4EAED]'
            ]"
          >
            <!-- Avatar: Icono del Sistema vs Avatar de Usuario -->
            <div
              v-if="isSystemComment(comment.content)"
              class="w-8 h-8 rounded-full bg-[#263840] text-white flex items-center justify-center font-bold text-xs shrink-0"
              title="Registro automático del Sistema"
            >
              <svg class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div
              v-else
              class="w-8 h-8 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-xs shrink-0"
            >
              {{ getInitials(comment.author?.name) }}
            </div>

            <!-- Contenido del Comentario u Homologacion de Auditoria -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-[#263840] flex items-center space-x-1.5">
                  <span>{{ comment.author?.name }}</span>
                  <span v-if="isSystemComment(comment.content)" class="bg-[#263840] text-sky-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                    SISTEMA
                  </span>
                </span>
                <span class="text-[10px] text-[#8CA7B3]">
                  {{ formattedTime(comment.createdAt) }}
                </span>
              </div>

              <!-- Texto -->
              <p
                :class="[
                  'text-xs mt-1 leading-relaxed',
                  isSystemComment(comment.content) ? 'text-[#263840] font-medium italic' : 'text-[#4A4A4A]'
                ]"
              >
                {{ isSystemComment(comment.content) ? cleanSystemText(comment.content) : comment.content }}
              </p>
            </div>

            <!-- Boton Borrar (Deshabilitado para comentarios del sistema) -->
            <button
              v-if="!isSystemComment(comment.content) && (comment.author?.id === authStore.user?.id || authStore.isAdmin)"
              @click="handleDeleteComment(comment.id)"
              type="button"
              class="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="Borrar comentario"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>
