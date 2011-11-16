package ut.cb.util.maps;

import java.util.Collection;
import java.util.LinkedHashSet;

public class SetMap<K, V> extends AbstractCollectionMap<K, V>
{

    @Override
    protected Collection<V> getEmptyCollection()
    {
        return new LinkedHashSet<V>();
    }

}