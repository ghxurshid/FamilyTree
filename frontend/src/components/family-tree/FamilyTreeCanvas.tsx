import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CARD_H,
  CARD_W,
  GAP_X,
  PANEL_WIDTH,
  RAIL_GUTTER,
  SPOUSE_W,
} from '@/constants/tree';
import { useTreeCamera, type CameraBounds, type CameraInsets } from '@/features/family-tree/hooks/useTreeCamera';
import { useTreeLayout } from '@/features/family-tree/hooks/useTreeLayout';
import { buildConnectors, buildNodeModels } from '@/features/family-tree/lib/nodes';
import { connectorBusY, type LayoutRow } from '@/features/family-tree/lib/layout';
import { relationLabel } from '@/features/family-tree/lib/relations';
import { ancestorsOf, carrierOf } from '@/features/family-tree/lib/treeIndex';
import { useCanEdit, useCurrentPersonId } from '@/features/auth/useCurrentPerson';
import { usePersonActions } from '@/features/people/usePersonActions';
import { peekHeight } from '@/hooks/useBottomSheet';
import { useFormat } from '@/hooks/useFormat';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { viewportHeight } from '@/services/telegram';
import { familyTreeStore, useFamilyTree } from '@/stores/familyTreeStore';
import { usePreferences } from '@/stores/preferencesStore';
import type { Person, PersonId } from '@/types/person';
import type { TreeDensity } from '@/types/ui';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { GenerationBands } from './GenerationBands';
import { GenerationRail } from './GenerationRail';
import { MiniMap } from './MiniMap';
import { PersonNode } from './PersonNode';
import { TreeConnectors } from './TreeConnectors';
import { TreeControls } from './TreeControls';
import { TreeFilters } from './TreeFilters';
import styles from './tree.module.css';
import ui from '@/components/ui/ui.module.css';

/** Ko'rish maydonidan tashqaridagi kartalarni chizmaslik chegarasi. */
const CULLING_THRESHOLD = 220;
const CULL_MARGIN = 700;
const CULL_STEP = 480;

interface VisibleBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function FamilyTreeCanvas(): JSX.Element {
  const format = useFormat();
  const isMobile = useIsMobile();
  const actions = usePersonActions();
  const canEdit = useCanEdit();

  const status = useFamilyTree((state) => state.status);
  const error = useFamilyTree((state) => state.error);
  const index = useFamilyTree((state) => state.index);
  const selectedId = useFamilyTree((state) => state.selectedId);
  const panelOpen = useFamilyTree((state) => state.panelOpen);
  const panelSnap = useFamilyTree((state) => state.panelSnap);
  const collapsed = useFamilyTree((state) => state.collapsed);
  const viewMode = useFamilyTree((state) => state.viewMode);
  const focusRequest = useFamilyTree((state) => state.focusRequest);
  const savingIds = useFamilyTree((state) => state.savingIds);

  const authedPersonId = useCurrentPersonId();
  const meId = authedPersonId ?? null;

  const showAvatars = usePreferences((state) => state.photos);
  const showRelationLabels = usePreferences((state) => state.relLabels);
  const showGenLabels = usePreferences((state) => state.genLabels);
  const showMinimap = usePreferences((state) => state.minimap);
  const motionReduced = usePreferences((state) => state.motionReduced);

  const layout = useTreeLayout();
  const [density, setDensity] = useState<TreeDensity>('mid');
  const [visibleBox, setVisibleBox] = useState<VisibleBox | null>(null);

  const boundsRef = useRef<CameraBounds>({ width: 1000, height: 1000 });
  const insetsRef = useRef<CameraInsets>({ left: 0, right: 0, bottom: 0 });
  const reducedMotionRef = useRef(motionReduced);
  reducedMotionRef.current = motionReduced;

  // Pastki varaq qancha joyni yopgan bo'lsa, kamera shuncha yuqoriga qaraydi.
  const sheetInset = !panelOpen || !isMobile
    ? 0
    : panelSnap === 'full'
      ? viewportHeight() * 0.56
      : peekHeight();

  boundsRef.current = { width: layout.bounds.width, height: layout.bounds.height };
  insetsRef.current = {
    left: isMobile ? 0 : RAIL_GUTTER,
    right: panelOpen && !isMobile ? PANEL_WIDTH : 0,
    bottom: sheetInset,
  };

  const camera = useTreeCamera({
    boundsRef,
    insetsRef,
    reducedMotionRef,
    onDensityChange: setDensity,
  });

  // — kartaning dunyo koordinatalari —
  const pointOf = useCallback(
    (id: PersonId): { x: number; y: number } | null => {
      const carrier = carrierOf(index, id);
      const position = layout.positions[carrier];
      if (!position) return null;
      const person = index.byId[id];
      const x = person?.spouseOf
        ? position.x + (CARD_W + GAP_X + SPOUSE_W) / 2 - CARD_W / 2
        : position.x;
      return { x, y: position.y + CARD_H / 2 };
    },
    [index, layout.positions],
  );

  const focusPerson = useCallback(
    (id: PersonId, zoom?: number) => {
      const point = pointOf(id);
      if (point) camera.focusPoint(point.x, point.y, zoom);
    },
    [camera, pointOf],
  );

  /**
   * Boshlang'ich langar. "Men" faqat kirgan foydalanuvchida bo'ladi; kirilmagan
   * bo'lsa shajaraning ildiziga tushamiz — butun daraxt MIN_ZOOM'ga ham sig'maydi
   * va `fitAll` ildizni ekrandan chiqarib yuboradi.
   */
  const homeAnchor = meId ?? index.rootId;

  const homeView = useCallback(() => {
    const point = homeAnchor ? pointOf(homeAnchor) : null;
    if (point) camera.homeView(point.x, point.y);
    else camera.fitAll();
  }, [camera, homeAnchor, pointOf]);

  // Kechiktirilgan chaqiruvlar eski `layout.positions` ustida yopilib qolmasligi uchun.
  const homeViewRef = useRef(homeView);
  homeViewRef.current = homeView;

  // Boshlang'ich ko'rinish — daraxt tayyor bo'lgach.
  const introDone = useRef(false);
  useEffect(() => {
    if (status !== 'ready' || introDone.current || !layout.order.length) return undefined;
    const timer = window.setTimeout(() => {
      introDone.current = true;
      // Chuqur havola (`?person=…`) kamerani o'zi boshqaradi — ustidan yozmaymiz.
      if (familyTreeStore.getState().focusRequest) return;
      homeView();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [homeView, layout.order.length, status]);

  // Mobil/desktopga o'tishda kamerani qayta moslash.
  useEffect(() => {
    if (!introDone.current) return undefined;
    const timer = window.setTimeout(homeView, 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Ko'rinish rejimi o'zgarganda butun daraxtni sig'dirish.
  const previousMode = useRef(viewMode);
  useEffect(() => {
    if (previousMode.current === viewMode) return;
    previousMode.current = viewMode;
    camera.fitAll();
  }, [camera, viewMode]);

  // Store'dan kelgan fokus so'rovlari.
  const lastFocusToken = useRef(0);
  useEffect(() => {
    if (!focusRequest || focusRequest.token === lastFocusToken.current) return;
    lastFocusToken.current = focusRequest.token;
    const timer = window.setTimeout(() => focusPerson(focusRequest.personId, focusRequest.zoom), 0);
    return () => window.clearTimeout(timer);
  }, [focusPerson, focusRequest]);

  // Katta daraxtlarda ko'rinmaydigan kartalarni chizmaymiz.
  const cullingOn = layout.order.length > CULLING_THRESHOLD;
  useEffect(() => {
    if (!cullingOn) {
      setVisibleBox(null);
      return undefined;
    }
    let frame = 0;
    return camera.subscribe((state) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = camera.viewportRect();
        const quantize = (value: number, dir: number) =>
          Math.round((value + dir * CULL_MARGIN) / CULL_STEP) * CULL_STEP;
        const next: VisibleBox = {
          x0: quantize(-state.x / state.k, -1),
          y0: quantize(-state.y / state.k, -1),
          x1: quantize((-state.x + rect.width) / state.k, 1),
          y1: quantize((-state.y + rect.height) / state.k, 1),
        };
        setVisibleBox((current) =>
          current &&
          current.x0 === next.x0 &&
          current.y0 === next.y0 &&
          current.x1 === next.x1 &&
          current.y1 === next.y1
            ? current
            : next,
        );
      });
    });
  }, [camera, cullingOn]);

  const nodes = useMemo(
    () =>
      buildNodeModels({
        index,
        layout,
        selectedId,
        meId,
        density,
        collapsed,
        savingIds,
        showAvatars,
        canEdit,
      }),
    [canEdit, collapsed, density, index, layout, meId, savingIds, selectedId, showAvatars],
  );

  const visibleNodes = useMemo(() => {
    if (!cullingOn || !visibleBox) return nodes;
    return nodes.filter(
      (node) =>
        node.x + node.width >= visibleBox.x0 &&
        node.x <= visibleBox.x1 &&
        node.y + node.height >= visibleBox.y0 &&
        node.y <= visibleBox.y1,
    );
  }, [cullingOn, nodes, visibleBox]);

  const connectors = useMemo(
    () => buildConnectors(index, layout, selectedId, collapsed, connectorBusY),
    [collapsed, index, layout, selectedId],
  );

  const relationText = useCallback(
    (person: Person) => {
      if (!showRelationLabels) return format.t(person.profession);
      if (meId) return format.t(relationLabel(index, meId, person.id));
      return format.t(person.profession || person.city || `${person.generation}-avlod`);
    },
    [format, index, meId, showRelationLabels],
  );

  const crumbs = useMemo<Crumb[]>(() => {
    if (!selectedId) return [];
    const carrier = carrierOf(index, selectedId);
    const chain = [carrier, ...ancestorsOf(index, carrier)].reverse().slice(-5);
    return chain.map((id) => ({
      id,
      name: format.name(index.byId[id]),
      relation: meId ? format.t(relationLabel(index, meId, id)) : '',
      current: id === carrier,
    }));
  }, [format, index, meId, selectedId]);

  const myGeneration = meId ? index.byId[meId]?.generation ?? null : null;

  const onRailSelect = useCallback(
    (row: LayoutRow) => {
      const xs = row.ids.map((id) => layout.positions[id].x);
      const k = Math.max(0.35, Math.min(camera.get().k, 0.7));
      camera.focusPoint((Math.min(...xs) + Math.max(...xs)) / 2, row.y, k, 640);
    },
    [camera, layout.positions],
  );

  const handleSelect = useCallback(
    (id: PersonId) => {
      if (camera.didDrag()) return;
      familyTreeStore.select(id);
    },
    [camera],
  );

  const handleAdd = useCallback((id: PersonId) => actions.add(id, 'child'), [actions]);

  const goHome = useCallback(() => {
    if (homeAnchor) familyTreeStore.select(homeAnchor);
    else camera.fitAll();
  }, [camera, homeAnchor]);

  const hasSpouses = useMemo(
    () => Object.keys(index.spouseOf).length > 0,
    [index.spouseOf],
  );

  // Yig'ish tugmasi faqat farzandi bor kartalarda bo'ladi — chegara shular soni.
  const branchCount = useMemo(() => Object.keys(index.childrenOf).length, [index.childrenOf]);
  const canExpandAll = collapsed.size > 0;
  const canCollapseAll = collapsed.size < branchCount;

  // Ommaviy ochish/yig'ishda joylashuv keskin siljiydi — kamera bo'sh maydonda
  // qolmasligi uchun yangi layout hisoblangach (setTimeout 0) qayta yo'naltiriladi.
  // Ochilganda butun daraxt MIN_ZOOM'ga ham sig'maydi, shuning uchun "menga"
  // qaytamiz; yig'ilganda esa bitta ildiz qoladi va u to'liq sig'adi.
  const expandAll = useCallback(() => {
    familyTreeStore.expandAll();
    window.setTimeout(() => homeViewRef.current(), 0);
  }, []);

  const collapseAll = useCallback(() => {
    familyTreeStore.collapseAll();
    window.setTimeout(() => camera.fitAll(), 0);
  }, [camera]);

  return (
    <>
      <div
        ref={camera.wrapRef}
        className={styles.viewport}
        role="application"
        aria-label={format.t('Oila daraxti')}
      >
        <div ref={camera.contentRef} className={styles.camera}>
          <GenerationBands
            rows={layout.rows}
            width={layout.bounds.width}
            showLabels={showGenLabels && density !== 'min'}
            myGeneration={myGeneration}
            label={format.generation}
            myLabel={format.t('sizning avlodingiz')}
          />

          <TreeConnectors
            width={Math.round(layout.bounds.width)}
            height={Math.round(layout.bounds.height)}
            links={connectors.links}
            glow={connectors.glow}
            dimmed={Boolean(selectedId)}
          />

          {visibleNodes.map((node) => (
            <PersonNode
              key={node.key}
              model={node}
              name={format.name(node.person)}
              years={[format.years(node.person), format.t(node.person.city)]
                .filter(Boolean)
                .join(' · ')}
              relation={relationText(node.person)}
              ariaLabel={`${format.name(node.person)}, ${relationText(node.person)}`}
              addLabel={format.t("Farzand qo'shish")}
              toggleLabel={format.t("Shoxni yig'ish yoki ochish")}
              meLabel={format.t('Siz')}
              onSelect={handleSelect}
              onAdd={handleAdd}
              onToggle={familyTreeStore.toggleCollapse}
            />
          ))}
        </div>

        {status === 'loading' ? (
          <div className={styles.stateOverlay}>
            <div className={styles.stateCard}>
              <span className={ui.spinner} />
              <span className={styles.stateText}>{format.t('Shajara yuklanmoqda…')}</span>
            </div>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className={styles.stateOverlay}>
            <div className={styles.stateCard}>
              <div className={styles.stateTitle}>{format.t('Shajara yuklanmadi')}</div>
              <div className={styles.stateText}>{error}</div>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnOutline}`}
                onClick={() => void familyTreeStore.load()}
              >
                {format.t('Qayta urinish')}
              </button>
            </div>
          </div>
        ) : null}

        {status === 'ready' && !layout.order.length ? (
          <div className={styles.stateOverlay}>
            <div className={styles.stateCard}>
              <div className={styles.stateTitle}>{format.t("Bu ko'rinishda odam yo'q")}</div>
              <div className={styles.stateText}>
                {format.t("Boshqa rejimni tanlang yoki butun oilaga qayting.")}
              </div>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnOutline}`}
                onClick={() => familyTreeStore.setViewMode('all')}
              >
                {format.t('Butun oila')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!isMobile && crumbs.length ? (
        <Breadcrumbs crumbs={crumbs} onSelect={(id) => familyTreeStore.select(id)} />
      ) : null}

      {!isMobile ? (
        <GenerationRail
          rows={layout.rows}
          myGeneration={myGeneration}
          label={format.generation}
          onSelect={onRailSelect}
        />
      ) : null}

      {!isMobile ? (
        <TreeFilters
          value={viewMode}
          onChange={familyTreeStore.setViewMode}
          showMarriage={hasSpouses}
          showMine={Boolean(meId)}
          t={format.t}
        />
      ) : null}

      <TreeControls
        camera={camera}
        homeLabel={format.t(meId ? 'Menga' : 'Boshiga')}
        showHomeLabel={!isMobile}
        onFit={() => camera.fitAll()}
        onHome={goHome}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        canExpandAll={canExpandAll}
        canCollapseAll={canCollapseAll}
        bottom={sheetInset ? sheetInset + 14 : 14}
        labels={{
          zoomIn: format.t('Kattalashtirish'),
          zoomOut: format.t('Kichraytirish'),
          fit: format.t('Butun daraxt'),
          home: format.t(meId ? 'Menga qaytish' : 'Shajara boshiga'),
          expandAll: format.t('Barcha shoxlarni ochish'),
          collapseAll: format.t("Barcha shoxlarni yig'ish"),
        }}
        minimap={
          showMinimap && !isMobile ? (
            <MiniMap
              layout={layout}
              index={index}
              meId={meId}
              camera={camera}
              label={format.t('Mini xarita')}
            />
          ) : null
        }
      />

      <TreeKeyboard
        camera={camera}
        onHome={goHome}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
    </>
  );
}

/** Klaviatura yorliqlari: +/-, 0, F, E/C va o'q tugmalari bilan navigatsiya. */
function TreeKeyboard({
  camera,
  onHome,
  onExpandAll,
  onCollapseAll,
}: {
  camera: ReturnType<typeof useTreeCamera>;
  onHome(): void;
  onExpandAll(): void;
  onCollapseAll(): void;
}): null {
  const index = useFamilyTree((state) => state.index);
  const selectedId = useFamilyTree((state) => state.selectedId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === '+' || event.key === '=') camera.zoomIn();
      else if (event.key === '-') camera.zoomOut();
      else if (event.key === '0') onHome();
      else if (event.key.toLowerCase() === 'f') camera.fitAll();
      else if (event.key.toLowerCase() === 'e') onExpandAll();
      else if (event.key.toLowerCase() === 'c') onCollapseAll();

      if (!selectedId) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;

      event.preventDefault();
      const carrier = carrierOf(index, selectedId);
      const person = index.byId[carrier];
      if (!person) return;

      if (event.key === 'ArrowUp' && person.fatherId) {
        familyTreeStore.select(person.fatherId);
        return;
      }
      if (event.key === 'ArrowDown') {
        const kids = index.childrenOf[carrier] ?? [];
        if (kids.length) familyTreeStore.select(kids[0]);
        return;
      }
      if (!person.fatherId) return;
      const siblings = index.childrenOf[person.fatherId] ?? [];
      const position = siblings.indexOf(carrier);
      if (event.key === 'ArrowLeft' && position > 0) familyTreeStore.select(siblings[position - 1]);
      if (event.key === 'ArrowRight' && position >= 0 && position < siblings.length - 1) {
        familyTreeStore.select(siblings[position + 1]);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [camera, index, onCollapseAll, onExpandAll, onHome, selectedId]);

  return null;
}
