## 2024-04-07 - Minimize string allocations in YOLO row generation
**Learning:** In the YOLO dataset preparation pipeline (e.g., `worker/converters/geometry.py`), flattening coordinates for polygon bounding boxes using multiple string manipulations (like `" ".join([f"{x:.6f} {y:.6f}" for ...])` concatenated with `class_id`) incurs unnecessary string allocation overhead. This affects performance significantly for large datasets.
**Action:** Use a single `" ".join(parts)` operation by appending `str(class_id)` and each coordinate directly to a single list (`parts`) to minimize string allocations.

## 2026-04-08 - Prevent N+1 inserts by manually generating UUIDs
**Learning:** Using `db.flush()` inside a loop to retrieve an auto-generated database ID (e.g., for creating relational history records) forces the ORM to execute individual `INSERT` statements sequentially. In routes that save many items simultaneously (like `save_annotations`), this causes an N+1 insertion bottleneck.
**Action:** Manually generate UUIDs before creating the ORM object. This provides the primary key necessary for relational foreign keys immediately, allowing the removal of `db.flush()` from the loop. The ORM can then optimize the transaction into a bulk insert on `db.commit()`.

## 2026-04-09 - Avoid db.flush() when batching isn't possible
**Learning:** I tried removing `db.flush()` when inserting a single `Image` and a single `Task` (which are in different tables) thinking it would allow SQLAlchemy to batch the inserts. This didn't work because SQLAlchemy only batches inserts (via `executemany`) when inserting multiple rows into the *same* table. This resulted in no measurable performance improvement and was rejected in code review.
**Action:** When attempting to batch inserts by removing `db.flush()`, ensure the inserts are for the same table. Otherwise, the optimization is invalid.

## 2026-04-09 - Watch out for frontend environment pollution during testing
**Learning:** Running `npm install` in the frontend directory for testing can sometimes unexpectedly remove or modify critical dependency types in `package-lock.json` (like `@types/react-dom`). If these modifications are accidentally committed, it can severely break the frontend build and type-checking.
**Action:** Always verify `git status` after running `npm install` or running tests, and aggressively `git restore` any unintended changes to lockfiles or package config unless explicitly modifying dependencies.
