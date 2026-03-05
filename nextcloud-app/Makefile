app_name=gilbertstodo

all: build

.PHONY: build
build:
	cd ../frontend && npm ci && npm run build:nc
	tar czf $(app_name).tar.gz \
		--transform 's,^,$(app_name)/,' \
		appinfo/ lib/ templates/ js/ img/

.PHONY: clean
clean:
	rm -rf js/ $(app_name).tar.gz
